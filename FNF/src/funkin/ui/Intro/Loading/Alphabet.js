// src/funkin/ui/Intro/Loading/Alphabet.js

// Ya no hay "import", AlphabetData ya existe globalmente
class Alphabet extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text, bold = false, scale = 1.0) {
        super(scene, x, y);
        this.scene = scene;
        this.text = text;
        this.bold = bold;
        this.scale = scale;
        this.letters = [];
        this.spacing = 0 * scale;
        this.width = 0; // Guardará el ancho total para poder centrarlo

        scene.add.existing(this);
        this.setVisible(true);
        this.createLetters();
    }

    static load(scene) {
        scene.load.image('alphabet', 'public/images/ui/alphabet.png');
    }

    static createAtlas(scene) {
        if (!scene.textures.exists('bold')) {
            const alphabetImg = scene.textures.get('alphabet').getSourceImage();
            // Usamos la variable global AlphabetData
            scene.textures.addAtlas('bold', alphabetImg, window.AlphabetData);
        }
    }

    createLetters() {
        if (!this.scene.textures.exists('bold')) {
            Alphabet.createAtlas(this.scene);
        }

        this.removeAll(true);
        this.letters = [];

        let xPos = 0;
        const texture = this.scene.textures.get("bold");

        const specialChars = {
            "#": "hashtag", "$": "dollarsign", "%": "%", "&": "amp",
            "(": "start parentheses", ")": "end parentheses", "*": "*", "+": "+", "-": "-",
            "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
            ":": ":", ";": ";", "<": "<", "=": "=", ">": ">", "@": "@",
            "[": "[", "\\": "\\", "]": "]", "^": "^", "_": "_",
            "'": "apostraphie", "!": "exclamation point", "?": "question mark",
            ".": "period", ",": "comma", "|": "|", "~": "~", "/": "forward slash", " ": null 
        };

        const bottomAlignedChars = ['.', ',', '_'];

        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            let prefix = "";

            if (specialChars[char] !== undefined) prefix = specialChars[char];
            else if (/^[A-Z]$/.test(char)) prefix = char + (this.bold ? " bold" : " capital");
            else if (/^[a-z]$/.test(char)) prefix = char + " lowercase";
            else prefix = char;

            if (prefix === null) {
                xPos += 40 * this.scale;
                continue;
            }

            const frameName = this.getOrCreateAnimation(prefix);

            if (frameName) {
                const letter = this.scene.add.sprite(xPos, 0, "bold");
                letter.play(frameName);

                if (bottomAlignedChars.includes(char)) {
                    letter.setOrigin(0.5, 1);
                    letter.y = 35 * this.scale;
                    letter.x += (letter.width * this.scale) / 2;
                } else {
                    letter.setOrigin(0, 0.5);
                    letter.y = 0;
                }

                letter.setScale(this.scale);
                this.add(letter);
                this.letters.push(letter);

                xPos += letter.width * this.scale + this.spacing;
            } else {
                xPos += 20 * this.scale;
            }
        }
        
        // Guardamos el ancho total calculado para poder centrar este contenedor desde afuera
        this.width = xPos;
    }

    getOrCreateAnimation(prefix) {
        const animKey = prefix;
        if (this.scene.anims.exists(animKey)) return animKey;

        const texture = this.scene.textures.get('bold');
        const allFrames = texture.getFrameNames();
        const animationFrames = allFrames.filter(frame => frame.startsWith(prefix));

        if (animationFrames.length > 0) {
            animationFrames.sort();
            this.scene.anims.create({
                key: animKey,
                frames: animationFrames.map(frameName => ({ key: 'bold', frame: frameName })),
                frameRate: 24,
                repeat: -1
            });
            return animKey;
        }
        return null;
    }

    setText(text) {
        this.text = text;
        this.createLetters();
    }

    setScale(scale) {
        this.scale = scale;
        this.createLetters();
    }

    setAlpha(alpha) {
        super.setAlpha(alpha);
        this.letters.forEach((letter) => letter.setAlpha(alpha));
    }
}

window.Alphabet = Alphabet;