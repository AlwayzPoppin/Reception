const fs = require('fs');
const path = require('path');

const CONDUIT_DIR = '.conduit';
const CONTEXT_FILE = path.join(CONDUIT_DIR, 'context.json');

// Ensure .conduit directory exists
if (!fs.existsSync(CONDUIT_DIR)) {
    fs.mkdirSync(CONDUIT_DIR);
}

// Ensure context.json exists
if (!fs.existsSync(CONTEXT_FILE)) {
    const initialContext = {
        session: { id: Math.random().toString(36).substring(7), started: new Date().toISOString() },
        contributions: [],
        handoffs: [],
        plans: [],
        agentIntents: {},
        activeFiles: [],
        relatedFiles: [],
        gitStatus: { branch: 'main', staged: [], modified: [], untracked: [], hasChanges: false },
        lastSync: new Date().toISOString()
    };
    fs.writeFileSync(CONTEXT_FILE, JSON.stringify(initialContext, null, 2));
}

function readContext() {
    try {
        const data = fs.readFileSync(CONTEXT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading context:', error);
        return null;
    }
}

function writeContext(context) {
    try {
        context.lastSync = new Date().toISOString();
        fs.writeFileSync(CONTEXT_FILE, JSON.stringify(context, null, 2));
    } catch (error) {
        console.error('Error writing context:', error);
    }
}

function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const key = args[i];
        if (key.startsWith('--')) {
            const prop = key.slice(2);
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                result[prop] = args[i + 1];
                i++;
            } else {
                result[prop] = true;
            }
        }
    }
    return result;
}

const args = parseArgs();
const context = readContext();

if (!context) process.exit(1);

// --status and --intent
if (args.agent && (args.status || args.intent)) {
    if (!context.agentIntents[args.agent]) {
        context.agentIntents[args.agent] = {};
    }
    if (args.status) context.agentIntents[args.agent].status = args.status;
    if (args.intent) context.agentIntents[args.agent].intent = args.intent;
    context.agentIntents[args.agent].lastUpdate = new Date().toISOString();
    console.log(`Updated status for ${args.agent}`);
}

// --log
if (args.log) {
    const agent = args.agent || 'unknown';
    context.contributions.push({
        type: 'contribution',
        agent: agent,
        action: args.log,
        files: [],
        timestamp: new Date().toISOString()
    });
    console.log(`Logged action for ${agent}: ${args.log}`);
}

// --add-plan
if (args['add-plan']) {
    context.plans.push({
        id: Math.random().toString(36).substring(7),
        description: args['add-plan'],
        priority: args.priority || 'medium',
        status: 'pending',
        created: new Date().toISOString()
    });
    console.log(`Added plan: ${args['add-plan']}`);
}

// --summary
if (args.summary) {
    console.log('--- CONDUIT SUMMARY ---');
    console.log('Intents:', JSON.stringify(context.agentIntents, null, 2));
    console.log('Recent Contributions:', context.contributions.slice(-3).map(c => `${c.agent}: ${c.action}`).join('\n'));
}

writeContext(context);
