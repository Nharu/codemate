export interface ConnectedUser {
    userId: string;
    username: string;
    socketId: string;
}

export interface Room {
    id: string;
    users: ConnectedUser[];
}

export interface CursorPosition {
    line: number;
    column: number;
}

export interface TextSelection {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface TextChange {
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    text: string;
}

export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
}

export interface CollaborationState {
    isConnected: boolean;
    room: Room | null;
    users: ConnectedUser[];
    cursors: Map<
        string,
        { position: CursorPosition; selection?: TextSelection }
    >;
    chatMessages: ChatMessage[];
}
