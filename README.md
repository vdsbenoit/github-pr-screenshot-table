# Screenshot Table

A Deno project for generating and managing tables of screenshots. This project is designed to help you organize, display, and process screenshots efficiently, making it ideal for documentation, testing, or visual comparison tasks.

> **Disclaimer:** This project is 100% vibe coded ✨

## Features
- Organize screenshots in a tabular format
- Easily add, update, and manage screenshots
- Simple CLI interface (main.ts)
- Extensible architecture for custom screenshot workflows

## Getting Started

### Prerequisites
- [Deno](https://deno.land/) installed (v1.0+)

### Installation
Clone the repository:
```sh
git clone https://github.com/vdsbenoit/github-pr-screenshot-table.git
cd github-pr-screenshot-table
```

### Usage
Run the main script:
```sh
deno run --allow-read --allow-write main.ts
```

You can also run tests:
```sh
deno test main_test.ts
```

Build the app (MacOS):
```sh
deno task build:app
```

Then double click on the app in the /app directory

You can move the app to your Applications folder to have it installed on your computer.

## Project Structure
- `main.ts` - Entry point for the CLI
- `main_test.ts` - Test suite
- `app/` - Application logic and modules
- `dist/` - The build output directory
- `deno.json` - Deno configuration

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
