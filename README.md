<p align="center">
  <a href="https://pickle.com/glass">
   <img src="./public/assets/banner.gif" alt="Logo">
  </a>

  <h1 align="center">Glass by Pickle: Digital Mind Extension 🧠</h1>

</p>

<p align="center">
  <a href="https://github.com/roblucci9302/Lucidi/actions/workflows/integration-tests.yml">
    <img src="https://github.com/roblucci9302/Lucidi/actions/workflows/integration-tests.yml/badge.svg" alt="Integration Tests">
  </a>
  <a href="https://github.com/roblucci9302/Lucidi/actions/workflows/unit-tests.yml">
    <img src="https://github.com/roblucci9302/Lucidi/actions/workflows/unit-tests.yml/badge.svg" alt="Unit Tests">
  </a>
  <a href="https://github.com/roblucci9302/Lucidi/actions/workflows/build.yml">
    <img src="https://github.com/roblucci9302/Lucidi/actions/workflows/build.yml/badge.svg" alt="Build">
  </a>
</p>

<p align="center">
  <a href="https://discord.gg/UCZH5B5Hpd"><img src="./public/assets/button_dc.png" width="80" alt="Pickle Discord"></a>&ensp;<a href="https://pickle.com"><img src="./public/assets/button_we.png" width="105" alt="Pickle Website"></a>&ensp;<a href="https://x.com/intent/user?screen_name=leinadpark"><img src="./public/assets/button_xe.png" width="109" alt="Follow Daniel"></a>
</p>

> This project is a fork of [CheatingDaddy](https://github.com/sohzm/cheating-daddy) with modifications and enhancements. Thanks to [Soham](https://x.com/soham_btw) and all the open-source contributors who made this possible!

🤖 **Fast, light & open-source**—Glass lives on your desktop, sees what you see, listens in real time, understands your context, and turns every moment into structured knowledge.

💬 **Proactive in meetings**—it surfaces action items, summaries, and answers the instant you need them.

🫥️ **Truly invisible**—never shows up in screen recordings, screenshots, or your dock; no always-on capture or hidden sharing.

To have fun building with us, join our [Discord](https://discord.gg/UCZH5B5Hpd)!

## Instant Launch

⚡️  Skip the setup—launch instantly with our ready-to-run macOS app.  [[Download Here]](https://www.dropbox.com/scl/fi/znid09apxiwtwvxer6oc9/Glass_latest.dmg?rlkey=gwvvyb3bizkl25frhs4k1zwds&st=37q31b4w&dl=1)

## Quick Start (Local Build)

### Prerequisites

First download & install [Python](https://www.python.org/downloads/) and [Node](https://nodejs.org/en/download).
If you are using Windows, you need to also install [Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/)

Ensure you're using Node.js version 20.x.x to avoid build errors with native dependencies.

```bash
# Check your Node.js version
node --version

# If you need to install Node.js 20.x.x, we recommend using nvm:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# nvm install 20
# nvm use 20
```

### Installation

```bash
npm run setup
```

### Optional Dependencies

Lucidi uses a graceful degradation system for optional dependencies. The core application works without them, but certain features require specific modules:

| Module | Purpose | Required For |
|--------|---------|-------------|
| `uuid` | ID generation | Document indexing, knowledge graph |
| `better-sqlite3` | Native SQLite | Full database functionality |
| `pg` | PostgreSQL driver | PostgreSQL external data sources |
| `mysql2` | MySQL driver | MySQL external data sources |

**Install optional dependencies as needed:**
```bash
# All optional dependencies
npm install uuid better-sqlite3 pg mysql2

# Or individually
npm install uuid          # For document services
npm install pg            # For PostgreSQL support
npm install mysql2        # For MySQL support
```

Without these modules, the application will use lightweight mocks and show informational warnings. See [DEPENDENCY_MANAGEMENT.md](./DEPENDENCY_MANAGEMENT.md) for details.

### Integration Testing with Docker

Lucidi provides Docker-based integration testing for PostgreSQL and MySQL:

**Quick Start:**
```bash
# Start test databases
npm run docker:start

# Run integration tests
npm run test:integration

# Stop test databases
npm run docker:stop
```

**Available commands:**
- `npm run docker:start` - Start PostgreSQL, MySQL, Redis containers
- `npm run docker:stop` - Stop all containers
- `npm run docker:reset` - Reset and restart with fresh data
- `npm run docker:health` - Check service health status
- `npm run test:integration` - Run all integration tests (PostgreSQL + MySQL + SQLite)
- `npm run test:integration:postgres` - PostgreSQL tests only (10 tests)
- `npm run test:integration:mysql` - MySQL tests only (10 tests)
- `npm run test:integration:sqlite` - SQLite tests only (10 tests)
- `npm run deps:check` - Check which dependencies are installed
- `npm run deps:status` - Check database service health

**Requirements:**
- Docker Desktop installed and running
- Ports 5432 (PostgreSQL), 3306 (MySQL), 6379 (Redis) available
- Optional: `npm install pg mysql2 better-sqlite3` for real database testing

**Test Coverage:** 30 integration tests (PostgreSQL: 10, MySQL: 10, SQLite: 10)

See [PHASE_3_PLAN_AND_ROADMAP.md](./PHASE_3_PLAN_AND_ROADMAP.md) for complete documentation.
See [tests/README.md](./tests/README.md) for testing guide.

### Continuous Integration (CI/CD)

Lucidi uses GitHub Actions for automated testing and quality assurance:

**Workflows:**
- **Integration Tests** - Automated database testing with PostgreSQL, MySQL, and SQLite
  - Runs on every push to `main`, `develop`, and `claude/**` branches
  - Uses GitHub Actions services for PostgreSQL and MySQL
  - Tests all 30 integration tests across 3 database systems
  - View workflow: [.github/workflows/integration-tests.yml](.github/workflows/integration-tests.yml)

- **Unit Tests** - Code quality and validation
  - Linting with ESLint
  - Security audit with npm audit
  - Test helpers and utilities validation
  - Build validation (package.json, test files)
  - View workflow: [.github/workflows/unit-tests.yml](.github/workflows/unit-tests.yml)

**Status badges** (shown at top of README) indicate current test status:
- ![Integration Tests](https://github.com/roblucci9302/Lucidi/actions/workflows/integration-tests.yml/badge.svg)
- ![Unit Tests](https://github.com/roblucci9302/Lucidi/actions/workflows/unit-tests.yml/badge.svg)
- ![Build](https://github.com/roblucci9302/Lucidi/actions/workflows/build.yml/badge.svg)

**Running workflows manually:**
- Go to [Actions tab](https://github.com/roblucci9302/Lucidi/actions)
- Select workflow (Integration Tests or Unit Tests)
- Click "Run workflow" button

## Highlights


### Ask: get answers based on all your previous screen actions & audio

<img width="100%" alt="booking-screen" src="./public/assets/00.gif">

### Meetings: real-time meeting notes, live summaries, session records

<img width="100%" alt="booking-screen" src="./public/assets/01.gif">

### Use your own API key, or sign up to use ours (free)

<img width="100%" alt="booking-screen" src="./public/assets/02.gif">

**Currently Supporting:**
- OpenAI API: Get OpenAI API Key [here](https://platform.openai.com/api-keys)
- Gemini API: Get Gemini API Key [here](https://aistudio.google.com/apikey)
- Local LLM Ollama & Whisper

### Liquid Glass Design (coming soon)

<img width="100%" alt="booking-screen" src="./public/assets/03.gif">

<p>
  for a more detailed guide, please refer to this <a href="https://www.youtube.com/watch?v=qHg3_4bU1Dw">video.</a>
  <i style="color:gray; font-weight:300;">
    we don't waste money on fancy vids; we just code.
  </i>
</p>


## Keyboard Shortcuts

`Ctrl/Cmd + \` : show and hide main window

`Ctrl/Cmd + Enter` : ask AI using all your previous screen and audio

`Ctrl/Cmd + Arrows` : move main window position

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/a23e342faafa84fa8797fa57762885d82fac1180.svg "Repobeats analytics image")

## Contributing

We love contributions! Feel free to open issues for bugs or feature requests. For detailed guide, please see our [contributing guide](/CONTRIBUTING.md).
> Currently, we're working on a full code refactor and modularization. Once that's completed, we'll jump into addressing the major issues.

### Contributors

<a href="https://github.com/pickle-com/glass/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=pickle-com/glass" />
</a>

### Help Wanted Issues

We have a list of [help wanted](https://github.com/pickle-com/glass/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22%F0%9F%99%8B%E2%80%8D%E2%99%82%EF%B8%8Fhelp%20wanted%22) that contain small features and bugs which have a relatively limited scope. This is a great place to get started, gain experience, and get familiar with our contribution process.


### 🛠 Current Issues & Improvements

| Status | Issue                          | Description                                       |
|--------|--------------------------------|---------------------------------------------------|
| 🚧 WIP      | Liquid Glass                    | Liquid Glass UI for MacOS 26 |

### Changelog

- Jul 5: Now support Gemini, Intel Mac supported
- Jul 6: Full code refactoring has done.
- Jul 7: Now support Claude, LLM/STT model selection
- Jul 8: Now support Windows(beta), Improved AEC by Rust(to seperate mic/system audio), shortcut editing(beta)
- Jul 8: Now support Local LLM & STT, Firebase Data Storage 


## About Pickle

**Our mission is to build a living digital clone for everyone.** Glass is part of Step 1—a trusted pipeline that transforms your daily data into a scalable clone. Visit [pickle.com](https://pickle.com) to learn more.

## Star History
[![Star History Chart](https://api.star-history.com/svg?repos=pickle-com/glass&type=Date)](https://www.star-history.com/#pickle-com/glass&Date)
