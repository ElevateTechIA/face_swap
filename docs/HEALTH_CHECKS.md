# Health Check Endpoints

## Overview

Health check endpoints allow monitoring services and uptime trackers to verify that your application is running correctly.

## Available Endpoints

### 1. `/api/ping` - Ultra-Light Ping

**Purpose:** Ultra-lightweight ping endpoint for basic uptime monitoring.

**Runtime:** Edge (maximum performance)

**Response Time:** < 50ms

**Use Case:** High-frequency health checks (every 30 seconds or more)

**Request:**
```bash
GET /api/ping
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T19:45:00.000Z"
}
```

**Features:**
- Minimal overhead
- No dependencies
- Runs on Edge runtime
- Perfect for UptimeRobot, Pingdom, etc.

---

### 2. `/api/health` - Standard Health Check

**Purpose:** Standard health check with basic service information.

**Runtime:** Node.js

**Response Time:** < 200ms

**Use Case:** Periodic health checks (every 1-5 minutes), monitoring dashboards

**Request:**
```bash
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T19:45:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "nodejs": "v20.19.0"
}
```

**Response Codes:**
- `200` - Service is healthy
- `503` - Service is unhealthy or degraded

**Features:**
- Server uptime
- Environment information
- Node.js version
- No caching (always fresh data)

---

##Integration Examples

### UptimeRobot

1. Go to UptimeRobot dashboard
2. Add New Monitor
3. Monitor Type: `HTTP(s)`
4. Friendly Name: `Face Swap App - Ping`
5. URL: `https://your-domain.com/api/ping`
6. Monitoring Interval: `5 minutes` (or less)
7. Keyword: `ok` (optional - verifies JSON response)

### Pingdom

1. Go to Pingdom dashboard
2. Add New Check
3. Check Type: `HTTP`
4. Name: `Face Swap API Health`
5. URL: `https://your-domain.com/api/health`
6. Check Interval: `1 minute`
7. Should contain: `healthy`

### Better Uptime

1. Go to Better Uptime dashboard
2. Create Monitor
3. Monitor Type: `HTTP(S)`
4. URL: `https://your-domain.com/api/ping`
5. Check frequency: `30 seconds`
6. Confirmation period: `30 seconds`

### Datadog Synthetics

```yaml
# Datadog Synthetic Test
tests:
  - name: Face Swap Health Check
    type: api
    subtype: http
    request:
      method: GET
      url: https://your-domain.com/api/health
    assertions:
      - type: statusCode
        operator: is
        target: 200
      - type: body
        operator: contains
        target: "healthy"
      - type: responseTime
        operator: lessThan
        target: 1000
```

### curl (Manual Testing)

```bash
# Test ping endpoint
curl https://your-domain.com/api/ping

# Test health endpoint
curl https://your-domain.com/api/health

# Pretty print JSON
curl -s https://your-domain.com/api/health | jq .
```

---

## Monitoring Best Practices

### 1. Check Frequency

- **High-Traffic Apps:** Use `/api/ping` every 30-60 seconds
- **Standard Apps:** Use `/api/health` every 1-5 minutes
- **Low-Traffic Apps:** Check every 5-10 minutes

### 2. Alert Thresholds

Recommended alert conditions:
- **Down:** 2 failed checks in a row
- **Slow:** Response time > 2 seconds
- **Degraded:** HTTP 503 response

### 3. Multi-Region Monitoring

Set up health checks from multiple regions:
- US East (Virginia)
- US West (California)
- Europe (Frankfurt/London)
- Asia (Singapore/Tokyo)

This helps detect:
- Regional outages
- DNS issues
- CDN problems
- Geographic latency issues

### 4. What to Monitor

Essential metrics:
- ✅ HTTP status code (200 = healthy)
- ✅ Response time (< 1s ideal)
- ✅ Response body contains expected keywords
- ✅ SSL certificate validity
- ✅ DNS resolution time

---

## Troubleshooting

### Health Check Returns 503

**Possible causes:**
1. Application is starting up (wait 30 seconds)
2. Database connection failed
3. Critical service is down
4. Out of memory

**Actions:**
1. Check application logs
2. Verify database connectivity
3. Check memory usage
4. Restart application if needed

### Health Check Times Out

**Possible causes:**
1. Server is overloaded
2. Network issues
3. Application is stuck/frozen
4. Too many concurrent requests

**Actions:**
1. Check server CPU/memory
2. Review recent deployments
3. Check for infinite loops in code
4. Restart application

### High Response Times

**Normal response times:**
- `/api/ping`: < 50ms
- `/api/health`: < 200ms

**If response time > 1s:**
1. Check server load (CPU/memory)
2. Review recent code changes
3. Check for database slow queries
4. Consider scaling up resources

---

## Security Considerations

### 1. Rate Limiting

Health check endpoints are public but should be rate-limited:
```typescript
// Already implemented in lib/security/rate-limiter.ts
// Health checks are limited to 100 requests/minute per IP
```

### 2. No Sensitive Data

Health endpoints NEVER expose:
- ❌ API keys
- ❌ Passwords
- ❌ User data
- ❌ Internal IPs
- ❌ Database credentials

### 3. DDoS Protection

If health checks are being abused:
1. Enable Cloudflare DDoS protection
2. Add rate limiting at CDN level
3. Use Vercel's built-in DDoS protection
4. Whitelist known monitoring IPs only

---

## Advanced Usage

### Custom Health Checks

You can extend the health endpoint to check specific services:

```typescript
// Example: Check database health
const checks = {
  database: await checkDatabaseHealth(),
  redis: await checkRedisHealth(),
  externalAPI: await checkAPIHealth(),
};
```

### Readiness vs Liveness

- **Liveness:** Is the app running? → `/api/ping`
- **Readiness:** Can the app serve traffic? → `/api/health`

In Kubernetes:
```yaml
livenessProbe:
  httpGet:
    path: /api/ping
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 5
```

---

## Monitoring Dashboard Example

Set up a simple status page using these endpoints:

```html
<!-- Simple status page -->
<!DOCTYPE html>
<html>
<head>
  <title>Status - Face Swap App</title>
</head>
<body>
  <h1>Service Status</h1>
  <div id="status">Checking...</div>

  <script>
    async function checkHealth() {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();

        const statusDiv = document.getElementById('status');
        if (data.status === 'healthy') {
          statusDiv.innerHTML = '✅ All Systems Operational';
          statusDiv.style.color = 'green';
        } else {
          statusDiv.innerHTML = '⚠️ System Degraded';
          statusDiv.style.color = 'orange';
        }
      } catch (error) {
        document.getElementById('status').innerHTML = '❌ System Down';
        document.getElementById('status').style.color = 'red';
      }
    }

    // Check every 30 seconds
    checkHealth();
    setInterval(checkHealth, 30000);
  </script>
</body>
</html>
```

---

## Next Steps

1. ✅ Health endpoints implemented
2. ⏳ Set up monitoring service (UptimeRobot/Pingdom)
3. ⏳ Configure alerting (email/SMS/Slack)
4. ⏳ Create status page (optional)
5. ⏳ Add to runbook/documentation

## Related Documentation

- [Error Boundaries](./ERROR_BOUNDARIES.md) - Error handling
- [Security Guide](../SECURITY_GUIDE.md) - Security features
- [README](../README.md) - General setup

---

**Last Updated:** 2026-01-13
