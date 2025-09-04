import { Injectable } from '@nestjs/common';

@Injectable()
export class CollaborationService {
    private documentVersions = new Map<string, number>();
    private documentContent = new Map<string, string>();

    getDocumentVersion(documentId: string): number {
        return this.documentVersions.get(documentId) ?? 0;
    }

    incrementDocumentVersion(documentId: string): number {
        const currentVersion = this.getDocumentVersion(documentId);
        const newVersion = currentVersion + 1;
        this.documentVersions.set(documentId, newVersion);
        return newVersion;
    }

    getDocumentContent(documentId: string): string {
        return this.documentContent.get(documentId) ?? '';
    }

    updateDocumentContent(documentId: string, content: string): void {
        this.documentContent.set(documentId, content);
        this.incrementDocumentVersion(documentId);
    }

    deleteDocument(documentId: string): void {
        this.documentVersions.delete(documentId);
        this.documentContent.delete(documentId);
    }
}
