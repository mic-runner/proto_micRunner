# Prototype R&D for micRunner project

### current state:

- [x] basic react app scaffold
- [x] ci pipeline deployment to [protomic.radmuffin.click](https://protomic.radmuffin.click)
- [x] skeleton ui
- [x] create a simple peer-to-peer connection
- [x] text chat works
- [x] custom peer id's
- [ ] connectivity still not 100%
    - [x] credentialed turn servers with 500MB free use (one connection used 3KB)
- [x] make connectivity reliable!
- [x] audio transmission
    - [x] explore audio quality
    - [ ] feedback issues????
    - [ ] see Charles's github issue

## Configuration

### Environment Variables

This project uses environment variables for sensitive configuration. For local development, copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### GitHub Secrets

For production deployment, the following secrets must be configured in the GitHub repository settings:

- `VITE_TURN_USERNAME`: Username for the TURN server
- `VITE_TURN_CREDENTIAL`: Credential/password for the TURN server

To add these secrets:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value


