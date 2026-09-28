module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    release: 'launch-ready-2026-09-28',
    sha: process.env.VERCEL_GIT_COMMIT_SHA || '',
    ref: process.env.VERCEL_GIT_COMMIT_REF || '',
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || '',
    environment: process.env.VERCEL_ENV || ''
  });
};
