export interface FileNode {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    children: FileNode[];
    size?: number;
    language?: string;
    updated_at?: string;
}

export interface FileData {
    id: string;
    path: string;
    size: number;
    language?: string;
    updated_at: string;
}

export function buildFileTree(files: FileData[]): FileNode[] {
    const root: FileNode[] = [];
    const nodeMap = new Map<string, FileNode>();

    // Sort files by path to ensure proper tree construction
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach((file) => {
        const pathParts = file.path.split('/').filter((part) => part !== '');
        let currentPath = '';
        let currentLevel = root;

        pathParts.forEach((part, index) => {
            const isLast = index === pathParts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            // Check if node already exists at this level
            let existingNode = currentLevel.find((node) => node.name === part);

            if (!existingNode) {
                // Create new node
                const newNode: FileNode = {
                    id: isLast ? file.id : `folder-${currentPath}`,
                    name: part,
                    path: currentPath,
                    type: isLast ? 'file' : 'folder',
                    children: [],
                    ...(isLast && {
                        size: file.size,
                        language: file.language,
                        updated_at: file.updated_at,
                    }),
                };

                currentLevel.push(newNode);
                nodeMap.set(currentPath, newNode);
                existingNode = newNode;
            } else if (isLast) {
                // Update existing node with file data
                existingNode.id = file.id;
                existingNode.type = 'file';
                existingNode.size = file.size;
                existingNode.language = file.language;
                existingNode.updated_at = file.updated_at;
            }

            // Move to next level
            currentLevel = existingNode.children;
        });
    });

    return root;
}

export function findNodeByPath(
    tree: FileNode[],
    path: string,
): FileNode | null {
    for (const node of tree) {
        if (node.path === path) {
            return node;
        }
        if (node.children.length > 0) {
            const found = findNodeByPath(node.children, path);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

export function getAllFiles(tree: FileNode[]): FileNode[] {
    const files: FileNode[] = [];

    function traverse(nodes: FileNode[]) {
        nodes.forEach((node) => {
            if (node.type === 'file') {
                files.push(node);
            } else {
                traverse(node.children);
            }
        });
    }

    traverse(tree);
    return files;
}
