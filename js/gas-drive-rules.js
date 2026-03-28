(function () {
    const DRIVE_ANYONE_LINK_REGEX =
        /(^[ \t>*-]*)file\.setSharing\(\s*DriveApp\.Access\.ANYONE_WITH_LINK\s*,\s*DriveApp\.Permission\.VIEW\s*\);?/gim;
    const DRIVE_GUIDE_BULLET =
        '- If a GAS workflow creates Drive files, do not auto-run file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW). Leave it removed or commented out and grant access at the destination folder instead.';
    const DRIVE_HARD_RULE =
        '- If the workflow creates Google Drive files, do not auto-run file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW). If broad access is needed, configure the destination folder sharing once and let created files inherit access from that folder.';
    const DRIVE_PERMISSION_SECTION = `## Google Drive Permission Rules
- Do not auto-run file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW) after creating a file
- Keep that line removed or commented out by default because Apps Script can throw when link sharing is blocked by admin policy or by the folder permission model
- If users must access created files broadly, share the destination folder once and create files inside that folder so they inherit access from the folder
- Store the destination folder ID in config or Script Properties and explain clearly that access should be granted at the folder level, not one file at a time
- If you still show sample code, use a commented line such as:
  // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
- If the workflow truly needs special permission handling, explain that newer Drive permission behavior may require the Drive API for folder-level access strategy instead of relying only on DriveApp convenience methods`;
    const DRIVE_COMMENT =
        '// file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // Disabled: share the destination folder instead';

    function isDriveRelevant(formState, promptText) {
        const desc = formState?.projectDesc || '';
        return /drive|shared drive|folder permission|file sharing|แชร์ไฟล์|แชร์โฟลเดอร์|สิทธิ์ drive|permission/i.test(desc)
            || (promptText || '').includes('## Google Drive Sharing Guidance');
    }

    function injectDriveHardRule(promptText) {
        if (!promptText || promptText.includes(DRIVE_HARD_RULE)) return promptText || '';
        const marker = '## Google Apps Script Hard Rules\n';
        if (!promptText.includes(marker)) return promptText;
        return promptText.replace(marker, `${marker}${DRIVE_HARD_RULE}\n`);
    }

    function injectDriveSection(promptText) {
        if (!promptText || promptText.includes('## Google Drive Permission Rules')) return promptText || '';
        const marker = '## Google Drive Sharing Guidance';
        if (promptText.includes(marker)) {
            return promptText.replace(marker, `${DRIVE_PERMISSION_SECTION}\n\n${marker}`);
        }
        return `${promptText}\n\n${DRIVE_PERMISSION_SECTION}`.trim();
    }

    function stripUnsafeDriveSharing(promptText) {
        if (!promptText || !DRIVE_ANYONE_LINK_REGEX.test(promptText)) return promptText || '';
        DRIVE_ANYONE_LINK_REGEX.lastIndex = 0;
        let next = promptText.replace(DRIVE_ANYONE_LINK_REGEX, (_, prefix = '') => `${prefix}${DRIVE_COMMENT}`);
        if (!next.includes('share the destination folder instead')) {
            next = `${next}\n\nNote: Prefer folder-level sharing for generated Drive files instead of per-file ANYONE_WITH_LINK access.`.trim();
        }
        return next;
    }

    const originalGetGasRecommendationGuide =
        typeof getGasRecommendationGuide === 'function' ? getGasRecommendationGuide : null;

    if (originalGetGasRecommendationGuide) {
        const wrappedGetGasRecommendationGuide = function getGasRecommendationGuideWithDriveRule() {
            const base = originalGetGasRecommendationGuide();
            if (!base) {
                return `Google Apps Script recommendations:\n${DRIVE_GUIDE_BULLET}`;
            }
            return base.includes(DRIVE_GUIDE_BULLET)
                ? base
                : `${base}\n${DRIVE_GUIDE_BULLET}`;
        };
        window.getGasRecommendationGuide = wrappedGetGasRecommendationGuide;
        getGasRecommendationGuide = wrappedGetGasRecommendationGuide;
    }

    const originalBuildGasPromptContext =
        typeof buildGasPromptContext === 'function' ? buildGasPromptContext : null;

    if (originalBuildGasPromptContext) {
        const wrappedBuildGasPromptContext = function buildGasPromptContextWithDriveRules(formState) {
            const base = originalBuildGasPromptContext(formState);
            if (!isDriveRelevant(formState, base)) {
                return base;
            }
            return injectDriveSection(injectDriveHardRule(base));
        };
        window.buildGasPromptContext = wrappedBuildGasPromptContext;
        buildGasPromptContext = wrappedBuildGasPromptContext;
    }

    const originalRewriteGasPromptIfNeeded =
        typeof rewriteGasPromptIfNeeded === 'function' ? rewriteGasPromptIfNeeded : null;

    if (originalRewriteGasPromptIfNeeded) {
        const wrappedRewriteGasPromptIfNeeded = async function rewriteGasPromptIfNeededWithDriveRules(apiKey, originalPrompt, draft) {
            const repaired = await originalRewriteGasPromptIfNeeded(apiKey, originalPrompt, draft);
            return stripUnsafeDriveSharing(repaired);
        };
        window.rewriteGasPromptIfNeeded = wrappedRewriteGasPromptIfNeeded;
        rewriteGasPromptIfNeeded = wrappedRewriteGasPromptIfNeeded;
    }

    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.th) {
        TRANSLATIONS.th.gasAutoRuleDrive =
            'เตือนเรื่อง Drive permission ใหม่: อย่า setSharing แบบ ANYONE_WITH_LINK กับไฟล์ที่เพิ่งสร้าง ให้แชร์ที่โฟลเดอร์แทน';
    }

    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.en) {
        TRANSLATIONS.en.gasAutoRuleDrive =
            'Warns about newer Drive permission behavior: avoid ANYONE_WITH_LINK on newly created files and share the destination folder instead';
    }

    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
})();
