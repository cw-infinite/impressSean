
# Project: Impress Sean / Figmock (The "How would you build Figma?" Challenge)

### The Backstory

During a recent job interview, I was asked the question: *"How would you build Figma?"*

To be honest, I froze. Even though I use Figma daily, I had never stopped to consider the underlying engineering architecture required to build such a powerful tool. While the interview moved on, the question stuck with me and wanted to impress Sean, or at least try.

I realized that **"I don't know"** is a temporary state, not a permanent one. I decided to at least I could try to impress Sean. I may not be able to do that but I will learn something at worst. The challenge: build a functional, lightweight version of a design canvas in just **5 days**.

This repository is the result of that challenge. It represents my attempt to reverse-engineer core design tool concepts, learn new libraries, and—most importantly—prove that I am the kind of developer who turns "I don't know" into "Let me build it and see."

---

### The 5-Day Sprint

This project was built under a tight constraint: **5 days from concept to MVP.**
To maximize velocity and learning, no testing required, no 100% type-safety, and wrote code with AI-assisted coding to accelerate boilerplate and architecture logic, allowing me to focus on the core interactions and UI flow.

### 🛠 Tech Stack

To create a snappy, responsive design experience, I selected:

* **[Tailwind CSS](https://tailwindcss.com/):** For rapid, responsive UI development.
* **[Anime.js](https://animejs.com/):** To handle smooth animations and interactions, bringing the canvas to life.
* **[Recharts](https://recharts.org/):** To integrate data-driven elements directly into the design interface.
* **[Appwrite](https://appwrite.io/)**: Integrate Auth and save projects created in Figmock
* **[TanStack](https://tanstack.com/)**: UI focused framework

---

### Key Features (The MVP)

* **Infinite Canvas Simulation:** [Describe your core feature, e.g., drag-and-drop elements].
* **Interaction Layer:** Powered by Anime.js for smooth user feedback.
* **Data Visualization:** Integrated Recharts to [e.g., show properties/metrics of objects].
* **Responsive UI:** Fully styled with Tailwind CSS.

---

### What I Learned

Building this pushed me to understand:

1. **State Management:** How to track coordinates and object properties in real-time.
2. **Animation Physics:** Using Anime.js to make the UI feel "fluid" rather than "stiff."
3. **Rapid Integration:** How to bridge the gap between UI frameworks and data libraries.

### To Sean:

Thank you for asking that question during our interview. It was the catalyst for this project and taught me more about design tool architecture in 5 days than I would have learned in a month of passive research.

---

### Installation & Local Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/your-project-name.git

# Install dependencies
npm install

# Run the development server
npm run dev
```
