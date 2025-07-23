# 🎮 AI-Powered RPG Game

A modern React-based RPG game featuring **AI-driven NPCs and enemies** powered by local LLM integration. Experience dynamic conversations, intelligent combat dialogue, and an immersive fantasy world where every character has personality!

![Game Screenshot](/public/game.png)

## ✨ Features

### 🤖 **AI-Powered Characters**
- **Smart NPCs**: Talk to merchants and wizards with dynamic, context-aware conversations
- **Intelligent Enemies**: Every enemy has unique personality and speaks during combat
- **Dynamic Dialogue**: Characters remember your level, gold, and inventory
- **Local LLM Integration**: Uses LM Studio for offline AI conversations

### ⚔️ **Combat System**
- **Turn-based Combat**: Strategic fighting with attack and flee options
- **Enemy Personalities**: Fight sarcastic goblins, philosophical skeletons, and dim-witted trolls
- **Dynamic Battle Dialogue**: Enemies taunt, react to damage, and give final words
- **Experience & Leveling**: Gain XP and level up to become stronger

### 💰 **Economy & Trading**
- **Gold Currency**: Earn gold from defeating enemies
- **Merchant Trading**: Sell items using natural language ("sell Magic Sword")
- **Inventory System**: Collect and manage various items
- **Item Values**: Different items have different worth

### 🗺️ **Game World**
- **Canvas-based Graphics**: Smooth 2D pixel-art style gameplay
- **Multiple NPCs**: Merchant, Wizard, and more to discover
- **Diverse Enemies**: 4 unique enemy types with distinct personalities
- **Treasure Hunting**: Find valuable items scattered across the world
- **Interactive Environment**: Rich world with grid-based movement

## 🎯 Game Characters

### 👥 **NPCs**
- **🛒 Merchant**: Friendly trader who buys and sells items using AI conversation
- **🔮 Wizard**: Mystical sage offering wisdom and lore about the world

### 👹 **Enemies**
- **🗡️ Snarky Goblin**: Sarcastic and cowardly, loves to taunt players
- **⚔️ Brutal Orc**: Aggressive warrior with intimidating battle cries  
- **💀 Melancholy Skeleton**: Sad, philosophical undead questioning existence
- **🏔️ Dim-witted Troll**: Simple-minded but surprisingly wise giant

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `WASD` / `Arrow Keys` | Move player |
| `Space` | Talk to NPCs (triggers AI conversation) |
| `F` | Fight nearby enemies |
| `E` | Collect treasure chests |
| `I` | Toggle inventory |
| `1` | Attack (during combat) |
| `2` | Flee (during combat) |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- [LM Studio](https://lmstudio.ai/) running locally
- A compatible language model (we recommend Llama 3.2)

### Quick Start

1. **Clone the repository**
   
2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up LM Studio**
   - Download and install [LM Studio](https://lmstudio.ai/)
   - Load a compatible model 
   - Start the local server (usually runs on `http://localhost:1234`)

4. **Configure environment**
   ```bash
   # Create .env.local file
   VITE_LLM_API_URL=
   VITE_LLM_MODEL=
   ```

5. **Start the game**
   ```bash
   pnpm start
   # or
   npm start
   ```

6. **Play!** 🎮
   Open [http://localhost:5173/](http://localhost:5173/) and start your adventure!

## 🏗️ Project Structure

```
src/
├── components/
│   └── GameCanvas.tsx          # Main game component
├── data/
│   ├── enemies.ts              # Enemy definitions & personalities
│   ├── npcs.ts                 # NPC configurations
│   ├── treasures.ts            # Treasure chest locations
│   └── itemPrices.ts           # Merchant pricing
├── services/
│   └── llmService.ts           # AI/LLM communication service
├── types/
│   └── GameTypes.ts            # TypeScript interfaces
├── utils/
│   └── gameUtils.ts            # Game utility functions
└── App.tsx                     # Root application
```

## 🎮 Gameplay Guide

### Getting Started
1. **Move around** using WASD or arrow keys
2. **Approach NPCs** (green/purple squares) and press `Space` to talk
3. **Find treasure chests** (gold squares) and press `E` to collect
4. **Fight enemies** (red squares) by pressing `F` when nearby

### Combat Tips
- **Wait for enemies to finish talking** before attacking
- **Level up** by defeating enemies to deal more damage
- **Flee** if your health gets too low
- Each enemy has **unique personality** - learn their patterns!

### Trading with the Merchant
- Collect valuable items from treasure chests
- Talk to the **Merchant** and say things like:
  - `"sell Magic Sword"`
  - `"I want to trade my Ancient Rune"`
  - `"buy my Silver Ring"`

### Items & Values
| Item | Value | Effect |
|------|-------|--------|
| Magic Sword | 100 gold | Valuable weapon |
| Ancient Rune | 75 gold | Mystical artifact |
| Silver Ring | 50 gold | Precious jewelry |
| Health Potion | 25 gold | Restores 50 HP |

## 🔧 Customization

### Adding New Enemies
Edit `src/data/enemies.ts`:
```typescript
{
  id: "newenemy1",
  name: "Cunning Fox",
  personality: "clever and mischievous",
  battleCries: ["Too slow!", "Catch me if you can!"],
  // ... other properties
}
```

### Adding New NPCs  
Edit `src/data/npcs.ts`:
```typescript
{
  id: "blacksmith",
  name: "Blacksmith",
  type: "crafter",
  dialogue: ["Need weapons forged?", "My hammer never rests!"],
  // ... other properties
}
```

### Changing AI Model
Update your `.env.local`:
```bash
VITE_LLM_MODEL=your-preferred-model-name
```

## 🤝 Contributing

We welcome contributions! Here are ways you can help:

- 🐛 **Bug Reports**: Found a bug? Open an issue!
- 💡 **Feature Ideas**: Suggest new gameplay mechanics
- 🎨 **Art & Design**: Improve graphics and UI
- 🧠 **AI Improvements**: Enhance character personalities
- 📝 **Documentation**: Help improve guides and docs

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 🎯 Roadmap

### Version 2.0 Features
- [ ] **Quest System**: Dynamic quests generated by AI
- [ ] **More NPCs**: Blacksmith, Innkeeper, Guards
- [ ] **Magic System**: Spells and magical abilities
- [ ] **Multiple Areas**: Dungeons, forests, towns
- [ ] **Save/Load**: Persistent game progress
- [ ] **Sound Effects**: Audio feedback for actions
- [ ] **Multiplayer**: Online co-op gameplay

### AI Enhancements
- [ ] **Memory System**: NPCs remember past conversations
- [ ] **Dynamic Events**: AI-generated random events
- [ ] **Procedural Quests**: AI creates unique missions
- [ ] **Emotional States**: Characters with changing moods

## 📋 Requirements

### System Requirements
- **OS**: Windows, macOS, or Linux
- **RAM**: 4GB minimum (8GB recommended for LM Studio)
- **Storage**: 2GB for game + model storage space
- **GPU**: Optional but recommended for faster AI inference

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

**🔴 "NPC seems distracted" message**
- Check if LM Studio is running
- Verify the API URL in `.env.local`
- Ensure the model is loaded in LM Studio

**🔴 Game won't start**
- Run `npm install` to update dependencies
- Check console for error messages
- Verify Node.js version (16+)

**🔴 Combat not working**
- Wait for enemy dialogue to finish
- Try refreshing the page
- Check browser console for errors

## 🙏 Acknowledgments

- **LM Studio** for providing excellent local LLM infrastructure
- **React** team for the amazing framework
- **Canvas API** for smooth 2D graphics
- **Open Source Community** for inspiration and tools

---

⭐ **Star this repo** if you enjoyed the game! It helps others discover this project.

🎮 **Happy Gaming!** May your adventures be epic and your conversations intelligent!