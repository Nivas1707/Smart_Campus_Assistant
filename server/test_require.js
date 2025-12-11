try {
    console.log("Loading ragService...");
    require('./utils/ragService');
    console.log("Loaded successfully.");
} catch (e) {
    console.error("Load failed:", e);
}
