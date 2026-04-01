/**
 * @file src/plugins/REXPlugins.js
 * Inyección masiva y segura de Plugins REX para Phaser.
 */

window.injectREXPlugins = function(config) {
    config.plugins = config.plugins || {};
    config.plugins.global = config.plugins.global || [];

    const rexPlugins = [
        { varName: 'rexbarrelpipelineplugin', key: 'rexBarrelPipeline' },
        { varName: 'rexcrtpipelineplugin', key: 'rexCRTPipeline' },
        { varName: 'rexglowfilterpipelineplugin', key: 'rexGlowFilterPipeline' },
        { varName: 'rexcolorreplacepipelineplugin', key: 'rexColorReplacePipeline' },
        { varName: 'rexkawaseblurpipelineplugin', key: 'rexKawaseBlurPipeline' },
        { varName: 'rexoutlinepipelineplugin', key: 'rexOutlinePipeline' }
    ];

    rexPlugins.forEach(p => {
        if (typeof window[p.varName] !== 'undefined') {
            config.plugins.global.push({
                key: p.key,
                plugin: window[p.varName],
                start: true,
                mapping: p.key
            });
            console.log(`Plugin REX '${p.key}' detectado e inyectado correctamente.`);
        }
    });

    return config;
};