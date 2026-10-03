const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const DATABASE_URL = String(process.env.FAMILY_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
const MAX_FAMILY_SIZE = 8;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function db() {
  if (!DATABASE_URL) {
    const e = new Error('Family Mode database is not configured.');
    e.code = 'FAMILY_DATABASE_UNCONFIGURED';
    throw e;
  }
  return neon(DATABASE_URL);
}
function fail(code, message, status) {
  const e = new Error(message);
  e.code = code;
  e.status = status || 400;
  throw e;
}
function cleanName(v) {
  const s = String(v || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  if (!s) fail('INVALID_NAME', 'Enter a name to join Family Mode.');
  return s;
}
function token() { return crypto.randomBytes(32).toString('base64url'); }
function hash(v) { return crypto.createHash('sha256').update(String(v || '')).digest('hex'); }
function code() {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  return out;
}
function normalizeCode(v) { return String(v || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6); }
function prettyCode(v) {
  const s = normalizeCode(v);
  return s.length === 6 ? s.slice(0, 3) + ' · ' + s.slice(3) : s;
}
function decisionType(v) {
  const s = String(v || '').toLowerCase();
  if (!['meal', 'restaurant'].includes(s)) fail('INVALID_DECISION_TYPE', 'Choose Meals or Restaurants.');
  return s;
}
function choice(v) {
  const s = String(v || '').toLowerCase();
  if (!['cut', 'maybe', 'choose'].includes(s)) fail('INVALID_CHOICE', 'Invalid choice.');
  return s;
}
function stage(v) {
  const s = String(v || '').toLowerCase();
  if (!['initial', 'finalist', 'tiebreak'].includes(s)) fail('INVALID_STAGE', 'Invalid stage.');
  return s;
}
function itemId(v) {
  const s = String(v || '').trim().slice(0, 160);
  if (!s || /[\x00-\x1f]/.test(s)) fail('INVALID_ITEM', 'Invalid choice.');
  return s;
}
function targetDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) fail('INVALID_DATE', 'Invalid dinner time.');
  return d;
}
function sanitizeSnapshot(input, type) {
  const raw = input && typeof input === 'object' ? input : {};
  const pool = Array.isArray(raw.pool) ? raw.pool.slice(0, 150) : [];
  const cleanPool = pool.map(function(item) {
    return {
      id: String(item && item.id || '').slice(0, 160),
      name: String(item && item.name || '').slice(0, 160),
      category: String(item && item.category || '').slice(0, 80),
      cuisine: String(item && item.cuisine || '').slice(0, 120),
      image: String(item && item.image || '').slice(0, 2000),
      address: String(item && item.address || '').slice(0, 500),
      website: String(item && item.website || '').slice(0, 1200),
      phone: String(item && item.phone || '').slice(0, 100),
      distance: Number.isFinite(Number(item && item.distance)) ? Number(item.distance) : null
    };
  }).filter(function(item) { return item.id && item.name; });

  if (!cleanPool.length) fail('INVALID_SNAPSHOT', 'Family rounds need at least one choice.');

  return {
    version: 1,
    decisionType: type,
    pool: cleanPool,
    hostExcluded: Array.isArray(raw.hostExcluded)
      ? Array.from(new Set(raw.hostExcluded.map(function(v){ return String(v).slice(0,160); }).filter(Boolean))).slice(0,150)
      : [],
    location: raw.location && Number.isFinite(Number(raw.location.lat)) && Number.isFinite(Number(raw.location.lon))
      ? { lat: Number(raw.location.lat), lon: Number(raw.location.lon) } : null,
    radius: Math.max(1, Math.min(100, Number(raw.radius) || 10)),
    searchTerm: String(raw.searchTerm || '').trim().slice(0,120),
    openState: ['open','all'].includes(String(raw.openState)) ? String(raw.openState) : 'all',
    quickCuts: Array.isArray(raw.quickCuts)
      ? Array.from(new Set(raw.quickCuts.map(function(v){ return String(v).slice(0,80); }).filter(Boolean))).slice(0,30)
      : [],
    frozenAt: new Date().toISOString()
  };
}
function publicFamily(r) {
  return { id:r.family_id, joinCode:prettyCode(r.join_code), memberCount:Number(r.member_count || 0), activeRoundId:r.active_round_id || null, schemaVersion:r.schema_version, createdAt:r.created_at, updatedAt:r.updated_at, lastActivityAt:r.last_activity_at };
}
function publicMember(r) {
  return { id:r.member_id, name:r.display_name, role:r.role, active:Boolean(r.active), joinedAt:r.joined_at, lastSeenAt:r.last_seen_at };
}
function publicRound(r) {
  if (!r) return null;
  return { id:r.round_id, status:r.status, decisionType:r.decision_type, snapshot:r.snapshot, dinnerTargetAt:r.dinner_target_at, stageStartedAt:r.stage_started_at, stageDeadlineAt:r.stage_deadline_at, currentStage:Number(r.current_stage), winnerItem:r.winner_item || null, winnerSaved:Boolean(r.winner_saved), expiresAt:r.expires_at, createdAt:r.created_at, updatedAt:r.updated_at, completedAt:r.completed_at || null };
}
async function auth(sql, value) {
  const rows = await sql.query('select * from family_members where token_hash = $1 and active = true limit 1', [hash(value)]);
  if (!rows[0]) fail('UNAUTHORIZED', 'Your Family Mode session is no longer active.', 401);
  return rows[0];
}
async function event(sql, familyId, roundId, memberId, eventType, payload) {
  await sql.query(
    'insert into family_events (family_id, round_id, member_id, event_type, payload) values ($1,$2,$3,$4,$5::jsonb)',
    [familyId, roundId || null, memberId || null, eventType, JSON.stringify(payload || {})]
  );
}
async function createFamily(nameValue) {
  const sql = db();
  const name = cleanName(nameValue);
  const memberId = crypto.randomUUID();
  const sessionToken = token();
  const tokenHash = hash(sessionToken);

  for (let attempt = 0; attempt < 5; attempt++) {
    const familyId = crypto.randomUUID();
    const joinCode = code();
    try {
      await sql.query('insert into family_rooms (family_id, join_code, member_count) values ($1,$2,0)', [familyId, joinCode]);
      await sql.query('insert into family_members (member_id, family_id, display_name, token_hash, role) values ($1,$2,$3,$4,$5)', [memberId, familyId, name, tokenHash, 'host']);
      await sql.query('update family_rooms set host_member_id=$1, member_count=1, updated_at=now(), last_activity_at=now() where family_id=$2', [memberId, familyId]);
      await event(sql, familyId, null, memberId, 'family_created', {});
      const family = (await sql.query('select * from family_rooms where family_id=$1', [familyId]))[0];
      const member = (await sql.query('select * from family_members where member_id=$1', [memberId]))[0];
      return { family:publicFamily(family), member:publicMember(member), token:sessionToken };
    } catch (err) {
      try { await sql.query('delete from family_rooms where family_id=$1', [familyId]); } catch (_) {}
      if (String(err && err.message || '').toLowerCase().includes('duplicate key') && String(err && err.message || '').includes('join_code')) continue;
      throw err;
    }
  }
  fail('CODE_UNAVAILABLE', 'Could not create a Family Mode room. Please try again.', 503);
}
async function joinFamily(codeValue, nameValue) {
  const sql = db();
  const joinCode = normalizeCode(codeValue);
  if (!/^[A-Z0-9]{6}$/.test(joinCode)) fail('INVALID_CODE', 'Enter the 6-character Family code.');
  const name = cleanName(nameValue);
  const familyRows = await sql.query('select * from family_rooms where join_code=$1 limit 1', [joinCode]);
  const family = familyRows[0];
  if (!family) fail('FAMILY_NOT_FOUND', 'That Family code was not found.', 404);

  const claimed = await sql.query(
    'update family_rooms set member_count=member_count+1, updated_at=now(), last_activity_at=now() where family_id=$1 and member_count < $2 returning *',
    [family.family_id, MAX_FAMILY_SIZE]
  );
  if (!claimed[0]) fail('FAMILY_FULL', 'This Family already has 8 members.', 409);

  const memberId = crypto.randomUUID();
  const sessionToken = token();
  try {
    await sql.query(
      'insert into family_members (member_id, family_id, display_name, token_hash, role) values ($1,$2,$3,$4,$5)',
      [memberId, family.family_id, name, hash(sessionToken), 'member']
    );
    await event(sql, family.family_id, null, memberId, 'member_joined', {});
  } catch (err) {
    await sql.query('update family_rooms set member_count=greatest(0, member_count-1), updated_at=now() where family_id=$1', [family.family_id]);
    throw err;
  }

  const nextFamily = (await sql.query('select * from family_rooms where family_id=$1', [family.family_id]))[0];
  const member = (await sql.query('select * from family_members where member_id=$1', [memberId]))[0];
  return { family:publicFamily(nextFamily), member:publicMember(member), token:sessionToken };
}
async function getFamilyState(sessionToken) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  await sql.query('update family_members set last_seen_at=now() where member_id=$1', [me.member_id]);
  await sql.query('update family_rooms set last_activity_at=now() where family_id=$1', [me.family_id]);

  const family = (await sql.query('select * from family_rooms where family_id=$1', [me.family_id]))[0];
  const members = await sql.query('select * from family_members where family_id=$1 and active=true order by joined_at asc', [me.family_id]);
  let round = null;
  let roundMembers = [];
  let myVotes = [];

  if (family.active_round_id) {
    round = (await sql.query('select * from family_rounds where round_id=$1 and family_id=$2', [family.active_round_id, family.family_id]))[0] || null;
    if (round) {
      roundMembers = await sql.query(
        'select frm.*, fm.display_name, fm.role from family_round_members frm join family_members fm on fm.member_id=frm.member_id where frm.round_id=$1 order by frm.joined_at asc',
        [round.round_id]
      );
      myVotes = await sql.query(
        'select stage,item_id,choice,updated_at from family_votes where round_id=$1 and member_id=$2 order by stage,item_id',
        [round.round_id, me.member_id]
      );
    }
  }

  return {
    family:publicFamily(family),
    me:publicMember(me),
    members:members.map(publicMember),
    activeRound:publicRound(round),
    roundMembers:roundMembers.map(function(r){
      return {
        memberId:r.member_id, name:r.display_name, role:r.role, included:Boolean(r.included),
        submittedStage1:Boolean(r.submitted_stage1_at), submittedStage2:Boolean(r.submitted_stage2_at),
        submittedTiebreak:Boolean(r.submitted_tiebreak_at), lastSeenAt:r.last_seen_at
      };
    }),
    myVotes:myVotes.map(function(v){ return {stage:v.stage,itemId:v.item_id,choice:v.choice,updatedAt:v.updated_at}; })
  };
}
async function createRound(sessionToken, payload) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  const family = (await sql.query('select * from family_rooms where family_id=$1', [me.family_id]))[0];
  if (!family || family.host_member_id !== me.member_id) fail('HOST_REQUIRED', 'Only the host can create the dinner decision.', 403);
  if (family.active_round_id) fail('ROUND_ACTIVE', 'Finish or end the current dinner decision first.', 409);

  const type = decisionType(payload && payload.decisionType);
  const snapshot = sanitizeSnapshot(payload && payload.snapshot, type);
  const dinnerTargetAt = targetDate(payload && payload.dinnerTargetAt);
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const round = (await sql.query(
    'insert into family_rounds (family_id,created_by_member_id,status,decision_type,snapshot,dinner_target_at,stage_started_at,expires_at) values ($1,$2,$3,$4,$5::jsonb,$6,now(),$7) returning *',
    [family.family_id, me.member_id, 'setup', type, JSON.stringify(snapshot), dinnerTargetAt, expiresAt]
  ))[0];

  const members = await sql.query('select member_id from family_members where family_id=$1 and active=true order by joined_at asc', [family.family_id]);
  for (const m of members) {
    await sql.query('insert into family_round_members (round_id,member_id,included) values ($1,$2,true) on conflict do nothing', [round.round_id, m.member_id]);
  }
  await sql.query('update family_rooms set active_round_id=$1,updated_at=now(),last_activity_at=now() where family_id=$2', [round.round_id, family.family_id]);
  await event(sql, family.family_id, round.round_id, me.member_id, 'round_created', {decisionType:type});
  return publicRound(round);
}
async function startRound(sessionToken) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  const family = (await sql.query('select * from family_rooms where family_id=$1', [me.family_id]))[0];
  if (!family || family.host_member_id !== me.member_id) fail('HOST_REQUIRED', 'Only the host can start the dinner decision.', 403);
  const round = family.active_round_id ? (await sql.query('select * from family_rounds where round_id=$1', [family.active_round_id]))[0] : null;
  if (!round) fail('NO_ROUND', 'No dinner decision is ready to start.', 409);
  if (round.status !== 'setup') fail('ROUND_ALREADY_STARTED', 'This dinner decision has already started.', 409);

  const target = round.dinner_target_at ? new Date(round.dinner_target_at).getTime() : Date.now() + 25 * 60 * 1000;
  const remaining = Math.max(8 * 60 * 1000, target - Date.now());
  const initialMs = Math.max(2 * 60 * 1000, Math.floor(remaining * 0.46));
  const deadline = new Date(Math.min(Date.now() + initialMs, target - 2 * 60 * 1000));

  const updated = (await sql.query(
    'update family_rounds set status=$1,current_stage=1,stage_started_at=now(),stage_deadline_at=$2,updated_at=now() where round_id=$3 and status=$4 returning *',
    ['swiping', deadline, round.round_id, 'setup']
  ))[0];
  if (!updated) fail('ROUND_STATE_CHANGED', 'The dinner decision changed. Refresh and try again.', 409);
  await event(sql, family.family_id, round.round_id, me.member_id, 'round_started', {});
  return publicRound(updated);
}
async function submitVote(sessionToken, payload) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  const roundId = itemId(payload && payload.roundId);
  const currentStage = stage(payload && payload.stage);
  const item = itemId(payload && payload.itemId);
  const currentChoice = choice(payload && payload.choice);

  const rows = await sql.query(
    'select fr.*,frm.included from family_rounds fr join family_round_members frm on frm.round_id=fr.round_id and frm.member_id=$1 where fr.round_id=$2 and fr.family_id=$3 limit 1',
    [me.member_id, roundId, me.family_id]
  );
  const round = rows[0];
  if (!round || !round.included) fail('ROUND_ACCESS', 'You are not part of this dinner decision.', 403);
  const expected = currentStage === 'initial' ? 'swiping' : currentStage === 'finalist' ? 'final_swiping' : 'tiebreak';
  if (round.status !== expected) fail('ROUND_STAGE', 'That stage is not accepting choices right now.', 409);
  if (round.stage_deadline_at && new Date(round.stage_deadline_at).getTime() < Date.now()) fail('STAGE_EXPIRED', 'That stage has expired.', 409);

  await sql.query(
    'insert into family_votes (round_id,stage,member_id,item_id,choice) values ($1,$2,$3,$4,$5) on conflict (round_id,stage,member_id,item_id) do update set choice=excluded.choice,updated_at=now()',
    [roundId, currentStage, me.member_id, item, currentChoice]
  );
  await sql.query('update family_members set last_seen_at=now() where member_id=$1', [me.member_id]);
  await sql.query('update family_round_members set last_seen_at=now() where round_id=$1 and member_id=$2', [roundId, me.member_id]);
  return {ok:true,roundId,stage:currentStage,itemId:item,choice:currentChoice};
}
async function markStageSubmitted(sessionToken, payload) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  const roundId = itemId(payload && payload.roundId);
  const currentStage = stage(payload && payload.stage);
  const col = currentStage === 'initial' ? 'submitted_stage1_at' : currentStage === 'finalist' ? 'submitted_stage2_at' : 'submitted_tiebreak_at';
  const rows = await sql.query(
    'select fr.round_id from family_rounds fr join family_round_members frm on frm.round_id=fr.round_id and frm.member_id=$1 where fr.round_id=$2 and fr.family_id=$3 and frm.included=true limit 1',
    [me.member_id, roundId, me.family_id]
  );
  if (!rows[0]) fail('ROUND_ACCESS', 'You are not part of this dinner decision.', 403);
  await sql.query('update family_round_members set ' + col + '=now(),last_seen_at=now() where round_id=$1 and member_id=$2', [roundId, me.member_id]);
  return {ok:true,roundId,stage:currentStage};
}
async function rotateCode(sessionToken) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  const family = (await sql.query('select * from family_rooms where family_id=$1', [me.family_id]))[0];
  if (!family || family.host_member_id !== me.member_id) fail('HOST_REQUIRED', 'Only the host can regenerate the Family code.', 403);

  for (let attempt=0; attempt<5; attempt++) {
    const newCode=code();
    try {
      const next=(await sql.query('update family_rooms set join_code=$1,join_code_rotated_at=now(),updated_at=now(),last_activity_at=now() where family_id=$2 returning *',[newCode,family.family_id]))[0];
      await event(sql,family.family_id,null,me.member_id,'join_code_rotated',{});
      return {joinCode:prettyCode(next.join_code)};
    } catch (err) {
      if (String(err && err.message || '').toLowerCase().includes('duplicate key')) continue;
      throw err;
    }
  }
  fail('CODE_UNAVAILABLE','Could not regenerate the Family code.',503);
}
async function endRound(sessionToken) {
  const sql = db();
  const me = await auth(sql, sessionToken);
  const family = (await sql.query('select * from family_rooms where family_id=$1', [me.family_id]))[0];
  if (!family || family.host_member_id !== me.member_id) fail('HOST_REQUIRED', 'Only the host can end the dinner decision.', 403);
  if (!family.active_round_id) return {ok:true};
  const round=(await sql.query('select * from family_rounds where round_id=$1',[family.active_round_id]))[0];
  if (!round) return {ok:true};
  const updated=(await sql.query("update family_rounds set status='ended',updated_at=now(),completed_at=now() where round_id=$1 and status not in ('complete','ended') returning *",[round.round_id]))[0] || round;
  await sql.query('update family_rooms set active_round_id=null,updated_at=now(),last_activity_at=now() where family_id=$1',[family.family_id]);
  await event(sql,family.family_id,round.round_id,me.member_id,'round_ended',{});
  return {ok:true,round:publicRound(updated)};
}
async function transferHost(sessionToken, targetMemberId) {
  const sql=db();
  const me=await auth(sql,sessionToken);
  const family=(await sql.query('select * from family_rooms where family_id=$1',[me.family_id]))[0];
  if (!family || family.host_member_id !== me.member_id) fail('HOST_REQUIRED','Only the current host can transfer hosting.',403);
  const target=(await sql.query('select * from family_members where member_id=$1 and family_id=$2 and active=true',[targetMemberId,family.family_id]))[0];
  if (!target) fail('MEMBER_NOT_FOUND','That family member could not be found.',404);
  await sql.query("update family_members set role='member' where family_id=$1 and member_id=$2",[family.family_id,me.member_id]);
  await sql.query("update family_members set role='host' where family_id=$1 and member_id=$2",[family.family_id,target.member_id]);
  await sql.query('update family_rooms set host_member_id=$1,updated_at=now(),last_activity_at=now() where family_id=$2',[target.member_id,family.family_id]);
  await event(sql,family.family_id,family.active_round_id,me.member_id,'host_transferred',{toMemberId:target.member_id});
  return {ok:true,hostMemberId:target.member_id};
}
module.exports = {createFamily,joinFamily,getFamilyState,createRound,startRound,submitVote,markStageSubmitted,rotateCode,endRound,transferHost};
