require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const jwks = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header, cb) {
  jwks.getSigningKey(header.kid, function (err, key) {
    if (err) return cb(err);
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing bearer token' });
  }
  const token = auth.split(' ')[1];

  jwt.verify(
    token,
    getKey,
    {
      audience: process.env.AZURE_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`
    },
    (err, decoded) => {
      if (err) {
        console.error('JWT verify error', err);
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
      }
      req.user = decoded;
      next();
    }
  );
};

async function audit(slipId, staffId, result, details) {
  try {
    await prisma.verificationLog.create({
      data: {
        slipId,
        staffId: staffId || 'unknown',
        result,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (e) {
    console.error('audit error', e);
  }
}

app.post('/queue/verify/:slipId', authMiddleware, async (req, res) => {
  try {
    const user = req.user || {};
    const rolesClaim = user.roles || user.role || user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const hasCounter =
      (Array.isArray(rolesClaim) && rolesClaim.includes('counter')) ||
      rolesClaim === 'counter';

    if (!hasCounter) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'User not authorized to verify slips' });
    }

    const slipId = req.params.slipId;
    const slip = await prisma.slip.findUnique({ where: { code: slipId } });

    if (!slip) {
      await audit(slipId, user.sub || user.oid, 'INVALID_SLIP', { note: 'not found' });
      return res.status(404).json({ code: 'INVALID_SLIP', message: 'Slip not found' });
    }

    if (slip.used) {
      await audit(slipId, user.sub || user.oid, 'ALREADY_USED', { usedAt: slip.usedAt });
      return res.status(409).json({ code: 'ALREADY_USED', message: 'This slip has already been used', usedAt: slip.usedAt });
    }

    if (slip.expiresAt && new Date(slip.expiresAt) < new Date()) {
      await audit(slipId, user.sub || user.oid, 'EXPIRED_SLIP', { expiresAt: slip.expiresAt });
      return res.status(410).json({ code: 'EXPIRED_SLIP', message: 'Slip expired', expiresAt: slip.expiresAt });
    }

    const updated = await prisma.slip.update({
      where: { code: slipId },
      data: {
        used: true,
        usedAt: new Date(),
        usedBy: user.sub || user.oid || user.email || 'unknown'
      }
    });

    await audit(slipId, user.sub || user.oid, 'SUCCESS', { usedBy: updated.usedBy });

    return res.status(200).json({ code: 'OK', message: 'Slip verified', slip: { code: updated.code, usedAt: updated.usedAt } });
  } catch (e) {
    console.error('verify error', e);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'An error occurred' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Slip verifier listening on ${port}`));
