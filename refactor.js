const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_PROCESS = ['app', 'src', 'components', 'lib'];

// Content replacements
const REPLACEMENTS = [
    { regex: /WarRoom/g, replacement: 'Chessboard' },
    { regex: /warRoom/g, replacement: 'chessboard' },
    { regex: /warroom/g, replacement: 'chessboard' },
    { regex: /War Room/g, replacement: 'Chessboard' },
    { regex: /war-room/g, replacement: 'chessboard' },
    { regex: /WAR_ROOM/g, replacement: 'CHESSBOARD' },
    { regex: /WarMap/g, replacement: 'ChessMap' },
    { regex: /warMap/g, replacement: 'chessMap' },
    { regex: /war-map/g, replacement: 'chess-map' }
];

function processFileContents(filePath) {
    if (fs.statSync(filePath).isDirectory()) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    for (const { regex, replacement } of REPLACEMENTS) {
        content = content.replace(regex, replacement);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated content: ${filePath}`);
    }
}

function processRenames(currentPath) {
    let stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
            processRenames(path.join(currentPath, file));
        }
    }

    const basename = path.basename(currentPath);
    let newBasename = basename;

    for (const { regex, replacement } of REPLACEMENTS) {
        newBasename = newBasename.replace(regex, replacement);
    }

    if (newBasename !== basename) {
        const dir = path.dirname(currentPath);
        const newPath = path.join(dir, newBasename);
        fs.renameSync(currentPath, newPath);
        console.log(`Renamed: ${currentPath} -> ${newPath}`);
    }
}

function walkForContents(currentPath) {
    let stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
            walkForContents(path.join(currentPath, file));
        }
    } else {
        processFileContents(currentPath);
    }
}

for (const dir of DIRECTORIES_TO_PROCESS) {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        // First update contents
        walkForContents(fullPath);
    }
}

// Then process renames (bottom-up is safer, but our recursive function does children first so it's fine)
for (const dir of DIRECTORIES_TO_PROCESS) {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        processRenames(fullPath);
    }
}

console.log('Refactoring complete.');
