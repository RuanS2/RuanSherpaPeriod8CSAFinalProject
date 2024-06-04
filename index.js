require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
});

client.on('ready', () => {
    console.log('The bot is online');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['1246497414286671947'];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    if (message.content.startsWith("FACT CHECK:")) {
        await handleFactCheck(message);
        return;
    }

    if (message.content.startsWith("ASK:")) {
        await handleAskQuestion(message);
        return;
    }

    const mentionedUser = message.mentions.users.first();
    if (mentionedUser && message.content.includes('!')) {
        await handleFactCheckUser(message, mentionedUser);
        return;
    }

    if (message.reference && message.reference.messageId) {
        const repliedToMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedToMessage.author.id === client.user.id) {
            await handleThreadReply(message, repliedToMessage);
            return;
        }
    }
});

const handleFactCheck = async (message) => {
    await message.channel.sendTyping();

    const sendTyping = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];

    conversation.push({
        role: 'system',
        content: 'Chat GPT is good'
    });

    let pastMessages = await message.channel.messages.fetch({ limit: 10 });
    pastMessages.reverse();

    pastMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        if (msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,  
            });

            return;
        }
        conversation.push({
            role: 'user',
            name: username,
            content: msg.content, 
        });

    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        });

        clearInterval(sendTyping);

        if (!response || !response.choices || response.choices.length === 0) {
            message.reply("I'm having trouble, try again later.");
            return;
        }

        const responseMessage = response.choices[0].message.content;
        const chunkSizeLimit = 2000;

        console.log("Response Message:", responseMessage);

        for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit);
            await message.reply(chunk);
        }
    } catch (error) {
        console.error('OpenAI Error:\n', error);
        clearInterval(sendTyping);
        message.reply("I'm having trouble, try again later.");
    }
};

const handleFactCheckUser = async (message, mentionedUser) => {
    await message.channel.sendTyping();

    const sendTyping = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let targetMessage;
    let pastMessages = await message.channel.messages.fetch({ limit: 100 });
    pastMessages.reverse();

    pastMessages.forEach((msg) => {
        if (msg.author.id === mentionedUser.id && !msg.content.startsWith(IGNORE_PREFIX)) {
            targetMessage = msg;
            return false;
        }
    });

    if (!targetMessage) {
        clearInterval(sendTyping);
        message.reply("Could not find a recent message from the mentioned user.");
        return;
    }

    let conversation = [];

    conversation.push({
        role: 'system',
        content: 'Chat GPT is good'
    });

    conversation.push({
        role: 'user',
        name: mentionedUser.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
        content: targetMessage.content
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        });

        clearInterval(sendTyping);

        if (!response || !response.choices || response.choices.length === 0) {
            message.reply("I'm having trouble, try again later.");
            return;
        }

        const responseMessage = response.choices[0].message.content;
        const chunkSizeLimit = 2000;

        console.log("Response Message:", responseMessage);

        for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit);
            await message.reply(chunk);
        }
    } catch (error) {
        console.error('OpenAI Error:\n', error);
        clearInterval(sendTyping);
        message.reply("I'm having trouble, try again later.");
    }
};

const handleAskQuestion = async (message) => {
    const question = message.content.slice(4).trim();
    if (!question) {
        message.reply("Please provide a question after 'ASK:'.");
        return;
    }

    await message.channel.sendTyping();

    const sendTyping = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [{
        role: 'system',
        content: 'You are a helpful assistant.'
    }];

    conversation.push({
        role: 'user',
        name: message.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
        content: question
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        });

        clearInterval(sendTyping);

        if (!response || !response.choices || response.choices.length === 0) {
            message.reply("I'm having trouble, try again later.");
            return;
        }

        const responseMessage = response.choices[0].message.content;
        const chunkSizeLimit = 2000;

        console.log("Response Message:", responseMessage);

        for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit);
            await message.reply(chunk);
        }
    } catch (error) {
        console.error('OpenAI Error:\n', error);
        clearInterval(sendTyping);
        message.reply("I'm having trouble, try again later.");
    }
};

const handleThreadReply = async (message, repliedToMessage) => {
    await message.channel.sendTyping();

    const sendTyping = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];

    conversation.push({
        role: 'system',
        content: 'You are a helpful assistant.'
    });

    let pastMessages = await message.channel.messages.fetch({ limit: 50 });
    pastMessages.reverse();

    pastMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,  
            });

            return;
        }
        conversation.push({
            role: 'user',
            name: username,
            content: msg.content, 
        });
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        });

        clearInterval(sendTyping);

        if (!response || !response.choices || response.choices.length === 0) {
            message.reply("I'm having trouble, try again later.");
            return;
        }

        const responseMessage = response.choices[0].message.content;
        const chunkSizeLimit = 2000;

        console.log("Response Message:", responseMessage);

        for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit);
            await message.reply(chunk);
        }
    } catch (error) {
        console.error('OpenAI Error:\n', error);
        clearInterval(sendTyping);
        message.reply("I'm having trouble, try again later.");
    }
};

client.login(process.env.TOKEN);
