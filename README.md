# BlockReader

A React application that imports Prefab block data from JSON files and analyzes material usage.

## Features

- **JSON Import**: Upload JSON files containing block data
- **Material Analysis**: Automatically counts and aggregates materials by name
- **Sorted Results**: Materials are sorted by quantity (highest first)
- **Beautiful UI**: Built with Tailwind CSS and DaisyUI components
- **Statistics**: Display total blocks and unique materials

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### JSON Format

Your JSON file should have a `blocks` array with objects containing a `name` property:

```json
{
  "blocks": [
    { "name": "stone" },
    { "name": "dirt" },
    { "name": "stone" },
    { "name": "oak_log" }
  ]
}
```

Each block object must have a `name` field. Additional properties are ignored.

### Usage

1. Click the file input to select a JSON file
2. The app will parse the file and count materials by name
3. View the results in a sorted table with statistics
4. Import another file to analyze different data

### Sample Data

A `sample-blocks.json` file is included for testing purposes.

## Build for Production

```bash
npm run build
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **DaisyUI 5** - Component library for Tailwind CSS

## License

MIT
