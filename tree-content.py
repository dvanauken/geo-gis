import os
from datetime import datetime

# Set the directory path
path = "."

# List of folders to exclude
exclude_folders = {"node_modules", ".angular", ".git", "dist", ".idea"}

# Define the output file name using a timestamp
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
output_file = f"tree.{timestamp}.txt"

def show_tree(current_path, prefix=""):
    try:
        # Get the list of items in the directory, excluding specified folders
        items = [item for item in os.listdir(current_path) if item not in exclude_folders]
        items.sort()

        for i, name in enumerate(items):
            is_last = (i == len(items) - 1)
            item_path = os.path.join(current_path, name)

            # Determine the prefix for tree branches
            if is_last:
                current_prefix = f"{prefix}-- "
                next_prefix = f"{prefix}   "
            else:
                current_prefix = f"{prefix}+-- "
                next_prefix = f"{prefix}|   "

            # Build the line to output
            if os.path.isdir(item_path):
                # It's a directory, recurse into it
                line = f"{current_prefix}{name}"
                write_line(line)
                show_tree(item_path, next_prefix)
            else:
                # It's a file, check if the extension is one of the specified ones
                extension = os.path.splitext(name)[1].lower()
                if extension in {'.html', '.ts', '.scss'}:
                    try:
                        # Read the file content
                        with open(item_path, 'r', encoding='utf-8') as file:
                            content = file.read().replace('\n', ' ').replace('\r', ' ')
                            line = f"{current_prefix}{name}: {content}"
                    except Exception as e:
                        line = f"{current_prefix}{name}: <error reading file>"
                    write_line(line)
                else:
                    line = f"{current_prefix}{name}"
                    write_line(line)

    except PermissionError:
        # Skip directories that don't have read permissions
        pass

def write_line(line):
    with open(output_file, 'a', encoding='utf-8') as file:
        file.write(line + "\n")

# Run the script
show_tree(path)
print(f"Directory structure saved to {output_file}.")
