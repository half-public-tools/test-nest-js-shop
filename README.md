# Test Nest.js shop

Trying out Nest.js with a shop API 

## Installation

```bash
# Install dependencies
npm install

# Generate a DB
npm run migrate
```

## First start
Open the generated DB with any sqlite DB manager and create a user. For password use the string `$2b$12$Vkl/XAAQpHIE97UuotudyOO/yElWd7DgBy6r..7Zy/BQzfCzhvTTG`, which corresponds to `qwertyui` password

## Running the app

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```
