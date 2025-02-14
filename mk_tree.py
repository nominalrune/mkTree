import os
import yaml

def list_yaml_files():
    return [f for f in os.listdir('.') if f.endswith('.yml') or f.endswith('.yaml')]

def create_structure(structure, root="."):
    for item in structure:
        if isinstance(item, dict):
            for dir_name, sub_structure in item.items():
                dir_path = os.path.join(root, dir_name)
                os.makedirs(dir_path, exist_ok=True)
                create_structure(sub_structure, dir_path)
        else:
            file_path = os.path.join(root, item)
            with open(file_path, 'w') as f:
                pass

def main():
    yaml_files = list_yaml_files()
    if not yaml_files:
        print("No YAML files found in the current directory.")
        return

    print("Select a YAML file to read:")
    for i, file in enumerate(yaml_files):
        print(f"{i + 1}. {file}")

    choice = int(input("Enter the number of the file: ")) - 1
    if choice < 0 or choice >= len(yaml_files):
        print("Invalid choice.")
        return

    yaml_file = yaml_files[choice]
    with open(yaml_file, 'r') as f:
        structure = yaml.safe_load(f)
    create_structure(structure)

if __name__ == "__main__":
    main()