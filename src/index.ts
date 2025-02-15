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
function createStructure(templates: string[], structure: Dir[], root: string = "."): void {
    structure.forEach((item: Dir) => {
        if (typeof item === 'object') {
            for (const dirName in item) {
                const dirPath = path.join(root, dirName);
                fs.ensureDirSync(dirPath);
                item[dirName] && createStructure(templates, item[dirName], dirPath);
            }
        } else {
            const filePath = path.join(root, item);
            const ext = item.startsWith('.') ? item : path.extname(item);
            const templateExts = templates.map(t => {
                const file = t.split('/').at(-1) ?? '';
                return file.startsWith('.') ? file : path.extname(file);
            });
            if (templateExts.includes(ext)) {
                const templateIndex = templateExts.indexOf(ext);
                const templateContent = fs.readFileSync(templates[templateIndex], 'utf8');
                
                const fileContent = templateContent.replace('${FILENAME}', path.basename(item, ext));
                // console.log({ item, ext, templateExts, templateIndex, tmp: templates[templateIndex], filePath, fileContent });
                fs.writeFileSync(filePath, fileContent);
            } else {
                fs.ensureFileSync(filePath);
            }
        }
    });
}

async function main() {
    const argv = await yargs(hideBin(process.argv)).option('dir', {
        alias: 'd',
        type: 'string',
        description: 'Directory to create files',
        default: '.'
    }).argv;

    const targetDir = argv.dir;
    if (!fs.existsSync(targetDir)) {
        console.log("Invalid directory.");
        return;
    }

    const templates = listTemplates(targetDir);
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
    const structure = yaml.parse(fileContent);
    // console.log("Creating structure..." + JSON.stringify(structure, null, 2));
    createStructure(templates, structure, targetDir);
    console.log("Structure created successfully.");
}

main();