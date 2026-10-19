import Conversation from "../models/convo_model.js";
import Message from "../models/msg_model.js";
import { AppError } from "../../../shared/errors.js";

const requireUserId = (req) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Please sign in before accessing your conversations."
        );
    }
    return userId;
};

const requireValue = (value, message) => {
    if (typeof value !== "string" || !value.trim()) {
        throw new AppError(400, "INVALID_INPUT", message);
    }
    return value.trim();
};

export const CreateConversation = async (req, res) => {
    const userID = requireUserId(req);
    const conversation = await Conversation.create({ userID });
    return res.status(200).json(conversation);
};

export const getConversations = async (req, res) => {
    const userID = requireUserId(req);
    const conversations = await Conversation.find({
        $or: [{ userID }, { user_id: userID }],
    }).sort({ updatedAt: -1 });
    return res.status(200).json(conversations);
};

export const updateConversation = async (req, res) => {
    const conversationId = requireValue(
        req.body?.conversation_id,
        "Please provide the conversation you want to update."
    );
    const title = requireValue(
        req.body?.title,
        "Please enter a title for this conversation."
    );
    const userID = requireUserId(req);

    const conversation = await Conversation.findOneAndUpdate(
        {
            _id: conversationId,
            $or: [{ userID }, { user_id: userID }],
        },
        { title },
        { returnDocument: "after", runValidators: true }
    );
    if (!conversation) {
        throw new AppError(
            404,
            "CONVERSATION_NOT_FOUND",
            "We couldn't find that conversation."
        );
    }
    return res.status(200).json(conversation);
};

export const deleteConversation = async (req, res) => {
    const conversationId = requireValue(
        req.params?.conversation_id,
        "Please provide the conversation you want to delete."
    );
    const conversation = await Conversation.findByIdAndDelete(conversationId);
    if (!conversation) {
        throw new AppError(
            404,
            "CONVERSATION_NOT_FOUND",
            "We couldn't find that conversation."
        );
    }

    const messages = await Message.deleteMany({
        conversation_id: conversationId,
    });
    return res.status(200).json({
        message: "Conversation deleted successfully.",
        delete_converstaion: conversation,
        delete_messages: messages,
    });
};

export const saveMessage = async (req, res) => {
    const conversationId = requireValue(
        req.body?.conversation_id,
        "Please choose a conversation before sending a message."
    );
    const role = requireValue(
        req.body?.role,
        "The message sender is missing. Please try again."
    );
    const content = req.body?.content;
    const artifacts = req.body?.artifacts ?? [];

    if (
        !Array.isArray(artifacts)
        || artifacts.some((artifact) => (
            !artifact
            || typeof artifact !== "object"
            || Array.isArray(artifact)
        ))
    ) {
        throw new AppError(
            400,
            "INVALID_ARTIFACTS",
            "One or more attachments are invalid. Please try again."
        );
    }
    if (!["user", "assistant"].includes(role)) {
        throw new AppError(
            400,
            "INVALID_MESSAGE_ROLE",
            "This message could not be saved. Please try again."
        );
    }
    if (
        (content !== undefined && typeof content !== "string")
        || (typeof content !== "string" && artifacts.length === 0)
    ) {
        throw new AppError(
            400,
            "INVALID_MESSAGE",
            "The message content is invalid. Please try again."
        );
    }

    const message = await Message.create({
        conversation_id: conversationId,
        role,
        content,
        artifacts: artifacts.length > 0
            ? [{
                type: artifacts.some((artifact) => artifact.file_path) ? "text" : "code",
                files: artifacts.map(({ name, content: fileContent, file_path, language }) => ({
                    name,
                    ...(fileContent != null && { content: fileContent }),
                    ...(file_path && { file_path }),
                    ...(language && { language }),
                })),
            }]
            : [],
        image_url: req.body?.image_url || undefined,
    });
    return res.status(200).json(message);
};

export const getMessages = async (req, res) => {
    const userID = requireUserId(req);
    const conversationId = requireValue(
        req.params?.conversationId,
        "Please choose a conversation to view its messages."
    );
    const conversation = await Conversation.findOne({
        _id: conversationId,
        $or: [{ userID }, { user_id: userID }],
    });
    if (!conversation) {
        throw new AppError(
            404,
            "CONVERSATION_NOT_FOUND",
            "We couldn't find that conversation."
        );
    }

    const messages = await Message.find({ conversation_id: conversationId });
    return res.status(200).json(messages);
};
