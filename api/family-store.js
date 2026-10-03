'use strict';

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const MAX_PARTICIPANTS = 8;
const ROUND_TTL_HOURS = 24;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SCHEMA_VERSION = 1;

let schemaReady = null;

function dbConnectionString() {
  return String(
    process.env.FAMILY_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    ''
  ).trim();
}

function database() {
  const url = dbConnectionString();
  if (!url) {
    const err = new Error('Family Mode database is not configured.');
    err.code = 'FAMILY_DB_MISSING';
    throw err;
  }
  return neon(url);
}

async function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = database();
    await sql`CREATE TABLE IF NOT EXISTS din_family (
      family_id TEXT PRIMARY KEY,
      join_code TEXT NOT NULL UNIQUE,
      family_name TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      current_host_id TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS din_family_participant (
      participant_id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES din_family(family_id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS din_family_participant_family_idx ON din_family_participant(family_id)`;
    await sql`CREATE TABLE IF NOT EXISTS din_family_round (
      round_id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES din_family(family_id) ON DELETE CASCADE,
      round_type TEXT NOT NULL CHECK (round_type IN ('food','restaurant')),
      stage TEXT NOT NULL CHECK (stage IN ('setup','swiping','finalists','final_vote','tie_break','winner','ended')),
      status TEXT NOT NULL CHECK (status IN ('active','completed','ended')),
      dinner_target_at TIMESTAMPTZ,
      pool JSONB NOT NULL DEFAULT '[]'::jsonb,
      host_excluded JSONB NOT NULL DEFAULT '[]'::jsonb,
      finalists JSONB NOT NULL DEFAULT '[]'::jsonb,
      winner JSONB,
      schema_version INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )`;
    await sql`CREATE INDEX IF NOT EXISTS din_family_round_family_idx ON din_family_round(family_id, created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS din_family_round_participant (
      round_id TEXT NOT NULL REFERENCES din_family_round(round_id) ON DELETE CASCADE,
      participant_id TEXT NOT NULL REFERENCES din_family_participant(participant_id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host','member')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      stage_done BOOLEAN NOT NULL DEFAULT FALSE,
      position INTEGER NOT NULL DEFAULT 0,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (round_id, participant_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS din_family_vote (
      round_id TEXT NOT NULL REFERENCES din_family_round(round_id) ON DELETE CASCADE,
      participant_id TEXT NOT NULL REFERENCES din_family_participant(participant_id) ON DELETE CASCADE,
      stage TEXT NOT NULL CHECK (stage IN ('swiping','finalists','final_vote','tie_break')),
      item_id TEXT NOT NULL,
      decision TEXT NOT NULL CHECK (decision IN ('cut','maybe','choose')),
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (round_id, participant_id, stage, item_id)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS din_family_vote_round_stage_idx ON din_family_vote(round_id, stage)`;
    return true;
  })().catch(err => {
    schemaReady = null;
    throw err;
  });
  return schemaReady;
}

function id(prefix) {
  return prefix + '_' + crypto.randomBytes(12).toString('hex');
}

function token() {
  return crypto.randomBytes(24).toString('base64url');
}

function tokenHash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function cleanName(value, max=80) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function validCode(code) {
  return /^[A-Z0-9]{6}$/.test(code);
}

function randomJoinCode() {
  let out = '';
  for (let i=0;i<6;i++) out += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  return out;
}

function normalizeRoundType(value) {
  return String(value || '').toLowerCase() === 'restaurant' ? 'restaurant' : 'food';
}

function normalizeStage(value) {
  const stage = String(value || '').toLowerCase();
  return ['swiping','finalists','final_vote','tie_break'].includes(stage) ? stage : 'swiping';
}

function normalizeDecision(value) {
  const decision = String(value || '').toLowerCase();
  return ['cut','maybe','choose'].includes(decision) ? decision : null;
}

function safeJson(value, fallback) {
  try {
    return value == null ? fallback : JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function roundExpiresAt(targetAt) {
  const target = targetAt ? new Date(targetAt) : null;
  const base = target && Number.isFinite(target.getTime()) ? target.getTime() : Date.now();
  return new Date(Math.max(base + 60 * 60 * 1000, Date.now() + ROUND_TTL_HOURS * 60 * 60 * 1000));
}

async function findParticipantByToken(sql, familyId, rawToken) {
  const hash = tokenHash(rawToken);
  const rows = await sql`SELECT participant_id, family_id, nickname, active
    FROM din_family_participant
    WHERE family_id=${familyId} AND token_hash=${hash}
    LIMIT 1`;
  return rows[0] || null;
}

async function createFamily({ nickname, familyName }) {
  await ensureSchema();
  const sql = database();
  const name = cleanName(nickname, 40);
  if (!name) throw Object.assign(new Error('Your name is required.'), {code:'BAD_INPUT'});
  const family = cleanName(familyName, 80);
  let joinCode = '';
  for (let i=0;i<8;i++) {
    const candidate = randomJoinCode();
    const existing = await sql`SELECT family_id FROM din_family WHERE join_code=${candidate} LIMIT 1`;
    if (!existing.length) { joinCode=candidate; break; }
  }
  if (!joinCode) throw Object.assign(new Error('Could not create a family code. Please try again.'), {code:'TEMPORARY'});
  const familyId = id('fam');
  const participantId = id('mem');
  const participantToken = token();
  const now = new Date();
  await sql`INSERT INTO din_family(family_id,join_code,family_name,created_by,current_host_id)
    VALUES(${familyId},${joinCode},${family},${participantId},${participantId})`;
  await sql`INSERT INTO din_family_participant(participant_id,family_id,nickname,token_hash)
    VALUES(${participantId},${familyId},${name},${tokenHash(participantToken)})`;
  return {familyId, joinCode, familyName:family, participantId, participantToken, createdAt:now.toISOString()};
}

async function joinFamily({ code, nickname }) {
  await ensureSchema();
  const normalized = normalizeCode(code);
  const name = cleanName(nickname, 40);
  if (!validCode(normalized)) throw Object.assign(new Error('Enter the 6-character family code.'), {code:'BAD_INPUT'});
  if (!name) throw Object.assign(new Error('Your name is required.'), {code:'BAD_INPUT'});
  const sql = database();
  const rows = await sql`SELECT family_id, family_name, active FROM din_family WHERE join_code=${normalized} LIMIT 1`;
  const family = rows[0];
  if (!family || !family.active) throw Object.assign(new Error('That family code is unavailable.'), {code:'NOT_FOUND'});
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM din_family_participant WHERE family_id=${family.family_id} AND active=TRUE`;
  const count = Number(countRows[0]?.count || 0);
  if (count >= MAX_PARTICIPANTS) throw Object.assign(new Error('This family is full.'), {code:'FULL'});
  const participantId = id('mem');
  const participantToken = token();
  await sql`INSERT INTO din_family_participant(participant_id,family_id,nickname,token_hash)
    VALUES(${participantId},${family.family_id},${name},${tokenHash(participantToken)})`;
  return {familyId:family.family_id, familyName:family.family_name, joinCode:normalized, participantId, participantToken};
}

async function authenticate(sql, familyId, rawToken) {
  const participant = await findParticipantByToken(sql,familyId,rawToken);
  if (!participant || !participant.active) throw Object.assign(new Error('Family session is no longer active.'), {code:'UNAUTHORIZED'});
  await sql`UPDATE din_family_participant SET last_seen_at=NOW() WHERE participant_id=${participant.participant_id}`;
  return participant;
}

async function getFamilyState({familyId, participantToken}) {
  await ensureSchema();
  const sql = database();
  const me = await authenticate(sql,familyId,participantToken);
  const families = await sql`SELECT family_id, join_code, family_name, current_host_id, active, created_at, updated_at
    FROM din_family WHERE family_id=${familyId} LIMIT 1`;
  const family = families[0];
  if (!family || !family.active) throw Object.assign(new Error('Family not found.'), {code:'NOT_FOUND'});
  const members = await sql`SELECT participant_id, nickname, active, created_at, last_seen_at
    FROM din_family_participant WHERE family_id=${familyId} ORDER BY created_at ASC`;
  const rounds = await sql`SELECT round_id, round_type, stage, status, dinner_target_at, pool, host_excluded, finalists, winner, schema_version, version, created_at, updated_at, expires_at
    FROM din_family_round WHERE family_id=${familyId} ORDER BY created_at DESC LIMIT 5`;
  const currentRound = rounds.find(r=>r.status==='active') || null;
  const currentParticipants = currentRound ? await sql`SELECT participant_id, role, active, stage_done, position, last_seen_at
    FROM din_family_round_participant WHERE round_id=${currentRound.round_id} ORDER BY joined_at ASC` : [];
  return {
    family:{
      familyId:family.family_id,
      joinCode:family.join_code,
      familyName:family.family_name,
      currentHostId:family.current_host_id,
      active:Boolean(family.active),
      createdAt:new Date(family.created_at).toISOString()
    },
    me:{participantId:me.participant_id,nickname:me.nickname},
    members:members.map(m=>({participantId:m.participant_id,nickname:m.nickname,active:Boolean(m.active),createdAt:new Date(m.created_at).toISOString(),lastSeenAt:new Date(m.last_seen_at).toISOString()})),
    currentRound:currentRound ? {
      roundId:currentRound.round_id,
      roundType:currentRound.round_type,
      stage:currentRound.stage,
      status:currentRound.status,
      dinnerTargetAt:currentRound.dinner_target_at ? new Date(currentRound.dinner_target_at).toISOString() : null,
      pool:safeJson(currentRound.pool,[]),
      hostExcluded:safeJson(currentRound.host_excluded,[]),
      finalists:safeJson(currentRound.finalists,[]),
      winner:safeJson(currentRound.winner,null),
      schemaVersion:Number(currentRound.schema_version||SCHEMA_VERSION),
      version:Number(currentRound.version||1),
      createdAt:new Date(currentRound.created_at).toISOString(),
      updatedAt:new Date(currentRound.updated_at).toISOString(),
      expiresAt:new Date(currentRound.expires_at).toISOString(),
      participants:currentParticipants.map(p=>({participantId:p.participant_id,role:p.role,active:Boolean(p.active),stageDone:Boolean(p.stage_done),position:Number(p.position||0),lastSeenAt:new Date(p.last_seen_at).toISOString()}))
    } : null
  };
}

async function startRound({familyId, participantToken, roundType, dinnerTargetAt, pool, hostExcluded}) {
  await ensureSchema();
  const sql = database();
  const host = await authenticate(sql,familyId,participantToken);
  const familyRows = await sql`SELECT family_id, current_host_id, active FROM din_family WHERE family_id=${familyId} LIMIT 1`;
  const family = familyRows[0];
  if (!family || !family.active) throw Object.assign(new Error('Family not found.'), {code:'NOT_FOUND'});
  if (family.current_host_id !== host.participant_id) throw Object.assign(new Error('Only the current host can start the family decision.'), {code:'FORBIDDEN'});
  const members = await sql`SELECT participant_id FROM din_family_participant WHERE family_id=${familyId} AND active=TRUE ORDER BY created_at ASC`;
  if (members.length < 2) throw Object.assign(new Error('At least 2 family members are needed.'), {code:'BAD_INPUT'});
  if (members.length > MAX_PARTICIPANTS) throw Object.assign(new Error('This family has too many active members.'), {code:'FULL'});
  const cleanPool = Array.isArray(pool) ? pool.slice(0,300) : [];
  if (!cleanPool.length) throw Object.assign(new Error('Leave at least one option for the family.'), {code:'BAD_INPUT'});
  const roundId = id('rnd');
  const excluded = Array.isArray(hostExcluded) ? hostExcluded.slice(0,300) : [];
  const expiresAt = roundExpiresAt(dinnerTargetAt);
  const target = dinnerTargetAt && Number.isFinite(new Date(dinnerTargetAt).getTime()) ? new Date(dinnerTargetAt) : null;
  await sql`UPDATE din_family_round SET status='ended', stage='ended', updated_at=NOW()
    WHERE family_id=${familyId} AND status='active'`;
  await sql`INSERT INTO din_family_round(round_id,family_id,round_type,stage,status,dinner_target_at,pool,host_excluded,created_by,expires_at)
    VALUES(${roundId},${familyId},${normalizeRoundType(roundType)},'swiping','active',${target},${JSON.stringify(cleanPool)}::jsonb,${JSON.stringify(excluded)}::jsonb,${host.participant_id},${expiresAt})`;
  for (const member of members) {
    await sql`INSERT INTO din_family_round_participant(round_id,participant_id,role)
      VALUES(${roundId},${member.participant_id},${member.participant_id===host.participant_id?'host':'member'})`;
  }
  return {roundId, participantCount:members.length, expiresAt:expiresAt.toISOString(), dinnerTargetAt:target ? target.toISOString() : null};
}

async function submitVote({familyId,participantToken,roundId,stage,itemId,decision,position=0}) {
  await ensureSchema();
  const sql = database();
  const me = await authenticate(sql,familyId,participantToken);
  const voteStage = normalizeStage(stage);
  const voteDecision = normalizeDecision(decision);
  const cleanItem = cleanName(itemId,120);
  if(!cleanItem || !voteDecision) throw Object.assign(new Error('Invalid vote.'), {code:'BAD_INPUT'});
  const rounds = await sql`SELECT round_id,stage,status,expires_at FROM din_family_round WHERE round_id=${roundId} AND family_id=${familyId} LIMIT 1`;
  const round=rounds[0];
  if(!round || round.status!=='active') throw Object.assign(new Error('This family decision is no longer active.'), {code:'CONFLICT'});
  if(new Date(round.expires_at).getTime() < Date.now()) throw Object.assign(new Error('This family decision has expired.'), {code:'EXPIRED'});
  const membership = await sql`SELECT active FROM din_family_round_participant WHERE round_id=${roundId} AND participant_id=${me.participant_id} LIMIT 1`;
  if(!membership?.[0]?.active) throw Object.assign(new Error('You are not part of this decision.'), {code:'FORBIDDEN'});
  await sql`INSERT INTO din_family_vote(round_id,participant_id,stage,item_id,decision,position)
    VALUES(${roundId},${me.participant_id},${voteStage},${cleanItem},${voteDecision},${Number.isFinite(Number(position))?Number(position):0})
    ON CONFLICT(round_id,participant_id,stage,item_id)
    DO UPDATE SET decision=EXCLUDED.decision, position=EXCLUDED.position, updated_at=NOW()`;
  await sql`UPDATE din_family_round_participant SET position=${Number.isFinite(Number(position))?Number(position):0}, last_seen_at=NOW()
    WHERE round_id=${roundId} AND participant_id=${me.participant_id}`;
  return {saved:true,roundId,participantId:me.participant_id,stage:voteStage,itemId:cleanItem,decision:voteDecision};
}

async function completeStage({familyId,participantToken,roundId,stage,position=0}) {
  await ensureSchema();
  const sql=database();
  const me=await authenticate(sql,familyId,participantToken);
  const normalized=normalizeStage(stage);
  const result=await sql`UPDATE din_family_round_participant
    SET stage_done=TRUE, position=${Number.isFinite(Number(position))?Number(position):0}, last_seen_at=NOW()
    WHERE round_id=${roundId} AND participant_id=${me.participant_id} AND active=TRUE
    RETURNING round_id,participant_id`;
  if(!result.length) throw Object.assign(new Error('You are not part of this decision.'), {code:'FORBIDDEN'});
  return {saved:true,roundId,stage:normalized,participantId:me.participant_id};
}

async function endRound({familyId,participantToken,roundId}) {
  await ensureSchema();
  const sql=database();
  const me=await authenticate(sql,familyId,participantToken);
  const rows=await sql`SELECT round_id, family_id, status FROM din_family_round WHERE round_id=${roundId} AND family_id=${familyId} LIMIT 1`;
  const round=rows[0];
  if(!round) throw Object.assign(new Error('Decision not found.'), {code:'NOT_FOUND'});
  const familyRows=await sql`SELECT current_host_id FROM din_family WHERE family_id=${familyId} LIMIT 1`;
  if(familyRows[0]?.current_host_id!==me.participant_id) throw Object.assign(new Error('Only the current host can end this decision.'), {code:'FORBIDDEN'});
  await sql`UPDATE din_family_round SET status='ended', stage='ended', updated_at=NOW() WHERE round_id=${roundId}`;
  return {ended:true,roundId};
}

async function regenerateCode({familyId,participantToken}) {
  await ensureSchema();
  const sql=database();
  const me=await authenticate(sql,familyId,participantToken);
  const rows=await sql`SELECT current_host_id, active FROM din_family WHERE family_id=${familyId} LIMIT 1`;
  const family=rows[0];
  if(!family?.active) throw Object.assign(new Error('Family not found.'), {code:'NOT_FOUND'});
  if(family.current_host_id!==me.participant_id) throw Object.assign(new Error('Only the current host can change the family code.'), {code:'FORBIDDEN'});
  let code='';
  for(let i=0;i<8;i++){
    const candidate=randomJoinCode();
    const existing=await sql`SELECT family_id FROM din_family WHERE join_code=${candidate} LIMIT 1`;
    if(!existing.length){code=candidate;break;}
  }
  if(!code) throw Object.assign(new Error('Could not generate a new family code.'), {code:'TEMPORARY'});
  await sql`UPDATE din_family SET join_code=${code}, updated_at=NOW() WHERE family_id=${familyId}`;
  return {joinCode:code};
}

module.exports={
  MAX_PARTICIPANTS,
  SCHEMA_VERSION,
  dbConnectionString,
  ensureSchema,
  createFamily,
  joinFamily,
  getFamilyState,
  startRound,
  submitVote,
  completeStage,
  endRound,
  regenerateCode,
  normalizeCode
};
