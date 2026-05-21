"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const backend_1 = require("@clerk/backend");
const zod_1 = require("zod");
// Create Clerk Client using environment variables
// It expects CLERK_SECRET_KEY to be set
const clerk = (0, backend_1.createClerkClient)({ secretKey: process.env.CLERK_SECRET_KEY || "" });
// Create an MCP server
const server = new mcp_js_1.McpServer({
    name: "clerk-mcp",
    version: "1.0.0",
});
// Tool 1: List Users
server.tool("clerk_list_users", "List Clerk users with optional filtering", {
    query: zod_1.z.string().optional().describe("Search query by email, name, etc."),
    limit: zod_1.z.number().optional().describe("Number of results to return (default 10)"),
    offset: zod_1.z.number().optional().describe("Offset for pagination"),
}, async ({ query, limit = 10, offset = 0 }) => {
    try {
        const { data, totalCount } = await clerk.users.getUserList({
            query,
            limit,
            offset,
        });
        return {
            content: [{ type: "text", text: JSON.stringify({ totalCount, users: data }, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error fetching users: ${error.message}` }],
            isError: true,
        };
    }
});
// Tool 2: Get User
server.tool("clerk_get_user", "Get a specific Clerk user by ID", {
    userId: zod_1.z.string().describe("The ID of the user to retrieve"),
}, async ({ userId }) => {
    try {
        const user = await clerk.users.getUser(userId);
        return {
            content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error fetching user: ${error.message}` }],
            isError: true,
        };
    }
});
// Tool 3: Update User Metadata
server.tool("clerk_update_user_metadata", "Update a user's public or private metadata", {
    userId: zod_1.z.string().describe("The ID of the user to update"),
    publicMetadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().describe("Public metadata to set/merge"),
    privateMetadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().describe("Private metadata to set/merge"),
}, async ({ userId, publicMetadata, privateMetadata }) => {
    try {
        const user = await clerk.users.updateUser(userId, {
            publicMetadata,
            privateMetadata,
        });
        return {
            content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error updating user metadata: ${error.message}` }],
            isError: true,
        };
    }
});
// Tool 4: Ban User
server.tool("clerk_ban_user", "Ban a specific user", {
    userId: zod_1.z.string().describe("The ID of the user to ban"),
}, async ({ userId }) => {
    try {
        const user = await clerk.users.banUser(userId);
        return {
            content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error banning user: ${error.message}` }],
            isError: true,
        };
    }
});
// Tool 5: Unban User
server.tool("clerk_unban_user", "Unban a specific user", {
    userId: zod_1.z.string().describe("The ID of the user to unban"),
}, async ({ userId }) => {
    try {
        const user = await clerk.users.unbanUser(userId);
        return {
            content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error unbanning user: ${error.message}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Clerk MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
