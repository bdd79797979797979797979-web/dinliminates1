'use strict';

const familyStore = require('./family-store');

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.setHeader?.('Cache-Control', 'no-store, max-age=0');
  res.end?.(JSON.stringify(payload));
}

function bodyFromRequest(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch {}
  }
  return {};
}

function clientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.socket?.remoteAddress || 'unknown');
}

const joinAttempts = new Map();

function allowJoinAttempt(ip) {
  const now = Date.now();
  const hit = joinAttempts.get(ip) || {count:0,started:now};
  if (now - hit.started > 5 * 60 * 1000) {
    hit.count = 0;
    hit.started = now;
  }
  hit.count += 1;
  joinAttempts.set(ip, hit);
  return hit.count <= 12;
}

function errorStatus(err) {
  switch (err?.code) {
    case 'BAD_INPUT': return 400;
    case 'UNAUTHORIZED': return 401;
    case 'FORBIDDEN': return 403;
    case 'NOT_FOUND': return 404;
    case 'FULL': return 409;
    case 'CONFLICT': return 409;
    case 'EXPIRED': return 410;
    case 'TEMPORARY': return 503;
    case 'FAMILY_DB_MISSING': return 503;
    default: return 500;
  }
}

function requireToken(req) {
  return String(req.headers?.['x-family-token'] || '').trim();
}

async function handleGet(req, res) {
  const url = new URL(req.url || '/', 'https://dinliminate.local');
  const familyId = String(url.searchParams.get('familyId') || '').trim();
  if (!familyId) return json(res,400,{ok:false,error:'Family ID is required.'});
  const participantToken = requireToken(req);
  if (!participantToken) return json(res,401,{ok:false,error:'Family session is required.'});
  return json(res,200,{ok:true,state:await familyStore.getFamilyState({familyId,participantToken})});
}

async function handlePost(req, res) {
  const body = bodyFromRequest(req);
  const action = String(body.action || '').trim().toLowerCase();

  if (action === 'create') {
    return json(res,201,{ok:true,result:await familyStore.createFamily({nickname:body.nickname,familyName:body.familyName})});
  }

  if (action === 'join') {
    const ip=clientIp(req);
    if (!allowJoinAttempt(ip)) return json(res,429,{ok:false,error:'Too many join attempts. Please try again shortly.'});
    return json(res,201,{ok:true,result:await familyStore.joinFamily({code:body.code,nickname:body.nickname})});
  }

  if (action === 'start-round') {
    const participantToken=requireToken(req);
    if (!participantToken) return json(res,401,{ok:false,error:'Family session is required.'});
    return json(res,201,{ok:true,result:await familyStore.startRound({
      familyId:String(body.familyId||'').trim(),
      participantToken,
      roundType:body.roundType,
      dinnerTargetAt:body.dinnerTargetAt,
      pool:body.pool,
      hostExcluded:body.hostExcluded
    })});
  }

  if (action === 'vote') {
    const participantToken=requireToken(req);
    if (!participantToken) return json(res,401,{ok:false,error:'Family session is required.'});
    return json(res,200,{ok:true,result:await familyStore.submitVote({
      familyId:String(body.familyId||'').trim(),
      participantToken,
      roundId:String(body.roundId||'').trim(),
      stage:body.stage,
      itemId:body.itemId,
      decision:body.decision,
      position:body.position
    })});
  }

  if (action === 'complete-stage') {
    const participantToken=requireToken(req);
    if (!participantToken) return json(res,401,{ok:false,error:'Family session is required.'});
    return json(res,200,{ok:true,result:await familyStore.completeStage({
      familyId:String(body.familyId||'').trim(),
      participantToken,
      roundId:String(body.roundId||'').trim(),
      stage:body.stage,
      position:body.position
    })});
  }

  if (action === 'end-round') {
    const participantToken=requireToken(req);
    if (!participantToken) return json(res,401,{ok:false,error:'Family session is required.'});
    return json(res,200,{ok:true,result:await familyStore.endRound({
      familyId:String(body.familyId||'').trim(),
      participantToken,
      roundId:String(body.roundId||'').trim()
    })});
  }

  if (action === 'regenerate-code') {
    const participantToken=requireToken(req);
    if (!participantToken) return json(res,401,{ok:false,error:'Family session is required.'});
    return json(res,200,{ok:true,result:await familyStore.regenerateCode({
      familyId:String(body.familyId||'').trim(),
      participantToken
    })});
  }

  return json(res,400,{ok:false,error:'Unknown Family Mode action.'});
}

module.exports=async function handler(req,res) {
  try {
    if (req.method === 'GET') return await handleGet(req,res);
    if (req.method === 'POST') return await handlePost(req,res);
    res.setHeader?.('Allow','GET, POST');
    return json(res,405,{ok:false,error:'Method not allowed.'});
  } catch (err) {
    console.error('[family]',err);
    return json(res,errorStatus(err),{ok:false,error:String(err?.message||'Family Mode request failed.')});
  }
};
