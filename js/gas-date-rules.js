(function () {
    const GAS_DATE_GUIDE_BULLET = '- Sanitize every Date object before compare/store/render: reject Invalid Date, avoid ambiguous new Date(userInput), and normalize output with Utilities.formatDate() in the intended timezone';
    const GAS_DATE_HARD_RULE = '- Sanitize every date value before compare, store, serialize, or render. Accept only valid Date objects, reject Invalid Date, avoid locale-dependent new Date(userInput), and normalize output with Utilities.formatDate() in the project timezone';
    const GAS_DATE_SECTION = `## GAS Date Sanitization
- Sanitize every date coming from Sheets, forms, query params, or external APIs before compare/store/render
- Accept only valid Date objects such as value instanceof Date && !Number.isNaN(value.getTime()); if the value is a string, parse the expected format explicitly and handle empty or invalid input early
- Do not trust ambiguous parsing like new Date('31/12/2026') or locale-dependent strings from users, Sheets, or URL parameters
- Before sending values to HtmlService, Google Docs placeholders, PDF filenames, notifications, or logs, convert dates into a safe string with Utilities.formatDate() and the intended timezone instead of passing raw Date objects around
- When comparing dates, compare normalized timestamps or normalized date-only strings after sanitization, not mixed raw Date, display string, and sheet values`;

    function injectDateHardRule(promptText) {
        if (!promptText || promptText.includes(GAS_DATE_HARD_RULE)) return promptText || '';
        const marker = '## Google Apps Script Hard Rules\n';
        if (!promptText.includes(marker)) return promptText;
        return promptText.replace(marker, `${marker}${GAS_DATE_HARD_RULE}\n`);
    }

    function injectDateSection(promptText) {
        if (!promptText || promptText.includes('## GAS Date Sanitization')) return promptText || '';

        const insertBeforeMarkers = [
            '## Google Sheets Data Safety',
            '## Data Layer Guidance',
            '## Notification Channel:',
            '## Notification Guidance'
        ];

        for (const marker of insertBeforeMarkers) {
            if (promptText.includes(marker)) {
                return promptText.replace(marker, `${GAS_DATE_SECTION}\n\n${marker}`);
            }
        }

        return `${promptText}\n\n${GAS_DATE_SECTION}`.trim();
    }

    const originalGetGasRecommendationGuide =
        typeof getGasRecommendationGuide === 'function' ? getGasRecommendationGuide : null;

    if (originalGetGasRecommendationGuide) {
        const wrappedGetGasRecommendationGuide = function getGasRecommendationGuideWithDateRule() {
            const base = originalGetGasRecommendationGuide();
            if (!base) {
                return `Google Apps Script recommendations:\n${GAS_DATE_GUIDE_BULLET}`;
            }
            return base.includes(GAS_DATE_GUIDE_BULLET)
                ? base
                : `${base}\n${GAS_DATE_GUIDE_BULLET}`;
        };
        window.getGasRecommendationGuide = wrappedGetGasRecommendationGuide;
        getGasRecommendationGuide = wrappedGetGasRecommendationGuide;
    }

    const originalBuildGasPromptContext =
        typeof buildGasPromptContext === 'function' ? buildGasPromptContext : null;

    if (originalBuildGasPromptContext) {
        const wrappedBuildGasPromptContext = function buildGasPromptContextWithDateRules(formState) {
            const base = originalBuildGasPromptContext(formState);
            return injectDateSection(injectDateHardRule(base));
        };
        window.buildGasPromptContext = wrappedBuildGasPromptContext;
        buildGasPromptContext = wrappedBuildGasPromptContext;
    }

    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.th) {
        TRANSLATIONS.th.gasAutoRuleDate =
            'ย้ำเรื่องการ sanitize Date object, timezone และการใช้ Utilities.formatDate()';
    }

    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.en) {
        TRANSLATIONS.en.gasAutoRuleDate =
            'Reinforces sanitizing Date objects, timezone control, and Utilities.formatDate() handling';
    }

    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
})();
