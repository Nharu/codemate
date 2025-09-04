'use client';

import { useState, useEffect } from 'react';
import { CollaborationWorkspace } from '@/components/collaboration';

export default function CollaboratePage() {
    const [token, setToken] = useState<string | null>(null);
    const [content, setContent] =
        useState(`// Welcome to CodeMate Collaboration Demo!
// This is a real-time collaborative code editor
// Multiple users can edit this file simultaneously

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Try editing this code with multiple browser tabs
// to see real-time collaboration in action!

console.log('Fibonacci numbers:');
for (let i = 0; i < 10; i++) {
    console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`);

    useEffect(() => {
        // For demo purposes, use a real JWT token from backend
        // In a real app, this would come from authentication
        const demoToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwic3ViIjoiMDQ3ODU1YzItZTM4Yi00MzdkLTkwNGYtNzE4Yzk4NWE2Y2M3IiwiaWF0IjoxNzU3MDEzNDYzLCJleHAiOjE3NTcwOTk4NjN9.9z0uq-1_7f-QDm6H2XK8xTJcDXTQCzhVxkCXdamIIyQ';
        setToken(demoToken);
    }, []);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
    };

    if (!token) {
        return (
            <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Initializing collaboration...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <CollaborationWorkspace
            token={token}
            initialContent={content}
            language="javascript"
            onContentChange={handleContentChange}
        />
    );
}
