import fs from 'fs-extra';
import yaml from 'yaml';
import path from 'path';
import readlineSync from 'readline-sync';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

function listYamlFiles(dir: string): string[] {
    return fs.readdirSync(dir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
}

function listTemplates(dir: string) {
    const templates = fs.readdirSync(path.join(dir, 'templates'));
    return templates.map(t => path.join(dir, 'templates', t));
}

type Dir = string | { [item: string]: Dir[]; };

function createStructure(templates: string[], structure: Dir[], root: string): void {
    structure.forEach((item: Dir) => {
        typeof item === 'string'
            ? createFile(templates, item, root)
            : createDir(templates, item, root);
    });
}
function createDir(templates: string[], dir: Dir & object, root: string) {
    for (const dirName in dir) {
        const dirPath = path.join(root, dirName);
        fs.ensureDirSync(dirPath);
        dir[dirName] && createStructure(templates, dir[dirName], dirPath);
    }
}
function createFile(templates: string[], file: string, root: string): void {
    const ext = getExt(file);
    const templateIndex = templates.map(getExt).indexOf(ext);
    const filePath = path.join(root, file);
    if (templateIndex === -1) {
        return fs.ensureFileSync(filePath);
    }
    const templateContent = fs.readFileSync(templates[templateIndex], 'utf8');
    const fileContent = templateContent.replace('${FILENAME}', path.basename(file, ext));
    return fs.writeFileSync(filePath, fileContent);
}

function getExt(filePath: string): string {
    const fileName = path.basename(filePath);
    return fileName.startsWith(".") ? fileName : path.extname(fileName);
}

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('dir', {
            alias: 'd',
            type: 'string',
            description: 'Directory to create files',
            default: '.'
        })
        .option("file", {
            alias: "f",
            type: "string",
            description: "YAML file to read"
        })
        .help("h")
        .version("1.0.0")
        .argv;

    const targetDir = argv.dir;
    if (!fs.existsSync(targetDir)) {
        console.log("Invalid directory.");
        return;
    }
    let structure: Dir[];
    if (argv.file && fs.existsSync(argv.file)) {
        const fileContent = fs.readFileSync(argv.file, 'utf8');
        structure = yaml.parse(fileContent) ?? [];
    } else {
        const yamlFiles = listYamlFiles(targetDir);
        if (yamlFiles.length === 0) {
            console.log("No YAML files found in the directory.");
            return;
        }

        console.log("Select a YAML file to read:");
        yamlFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file}`);
        });

        const choice = readlineSync.questionInt("Enter the number of the file: ") - 1;
        if (choice < 0 || choice >= yamlFiles.length) {
            console.log("Invalid choice.");
            return;
        }
        const yamlFile = yamlFiles[choice];
        const fileContent = fs.readFileSync(yamlFile, 'utf8');
        structure = yaml.parse(fileContent);
    }
    const templates = listTemplates(targetDir);
    console.log("Creating structure...");
    createStructure(templates, structure, targetDir);
    console.log("Structure created successfully.");
}

main();