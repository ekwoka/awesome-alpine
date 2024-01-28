Alpine.data('counter', () => ({
  count: 1,
  interval: null,
  init() {
    this.interval = setInterval(() => this.count++, 1000);
  },
  destroy() {
    clearInterval(this.interval);
  },
}));

Alpine.data('tasks', () => ({
  completions: [],
  tasks: {
    components: 'Testing Components',
    plugins: 'Installing Plugins',
    typescript: 'Using TypeScript & TailwindCSS',
    sharing: 'Instant Preview and Sharing for demos',
  },
}));
const alpineRegistry = 'https://registry.npmjs.com/alpinejs';
window.registryData ??= null;
Alpine.data('version', () => ({
  displayCount: 0,
  registryData: null,
  get versions() {
    return Object.keys(this.registryData?.versions ?? new Object(null)).map(
      (v) => v.replace(/\.(\d)\./, '.0$1.'),
    );
  },
  signal: new AbortController(),
  animationFrame: null,
  async init() {
    try {
      this.registryData = window.registryData ??= await (
        await fetch(alpineRegistry, {
          signal: this.signal.signal,
        })
      ).json();
    } catch (e) {
      console.error(e);
    }
    let delay = 0;
    const incrementer = () => {
      if (delay) delay--;
      else delay = Math.ceil((++this.displayCount * 2) ** 3 / 400_000);
      if (this.displayCount === this.versions.length - 1) return;
      this.animationFrame = requestAnimationFrame(incrementer);
    };
    this.animationFrame = requestAnimationFrame(incrementer);
  },
  destroy() {
    this.signal.abort();
    cancelAnimationFrame(this.animationFrame);
  },
}));
