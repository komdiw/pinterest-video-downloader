class LiquidEther {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;

        this.options = {
            colors: ['#5227FF', '#FF9FFC', '#B19EEF'],
            mouseForce: 20,
            cursorSize: 100,
            isViscous: false,
            viscous: 30,
            iterationsViscous: 32,
            iterationsPoisson: 32,
            resolution: 0.5,
            isBounce: false,
            autoDemo: true,
            autoSpeed: 0.5,
            autoIntensity: 2.2,
            takeoverDuration: 0.25,
            autoResumeDelay: 3000,
            autoRampDuration: 0.6,
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: 0, y: 0, vx: 0, vy: 0 };
        this.autoDemoTimer = null;
        this.autoDemoActive = false;
        this.animationId = null;

        this.init();
    }

    init() {
        this.createCanvas();
        this.createParticles();
        this.bindEvents();
        this.animate();

        if (this.options.autoDemo) {
            this.startAutoDemo();
        }
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';

        this.container.appendChild(this.canvas);

        this.resize();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * this.options.resolution;
        this.canvas.height = rect.height * this.options.resolution;

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    createParticles() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 3 + 1,
                color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
                originalRadius: Math.random() * 3 + 1
            });
        }
    }

    bindEvents() {
        const rect = this.container.getBoundingClientRect();

        this.container.addEventListener('mousemove', (e) => {
            const newX = (e.clientX - rect.left) * this.options.resolution;
            const newY = (e.clientY - rect.top) * this.options.resolution;

            this.mouse.vx = newX - this.mouse.x;
            this.mouse.vy = newY - this.mouse.y;
            this.mouse.x = newX;
            this.mouse.y = newY;

            if (this.options.autoDemo && this.autoDemoActive) {
                this.stopAutoDemo();
            }
        });

        this.container.addEventListener('mouseleave', () => {
            if (this.options.autoDemo && !this.autoDemoActive) {
                setTimeout(() => this.startAutoDemo(), this.options.autoResumeDelay);
            }
        });

        window.addEventListener('resize', () => this.resize());
    }

    startAutoDemo() {
        this.autoDemoActive = true;
        let angle = 0;

        const demo = () => {
            if (!this.autoDemoActive) return;

            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;

            const newX = centerX + Math.cos(angle) * radius;
            const newY = centerY + Math.sin(angle) * radius;

            this.mouse.vx = newX - this.mouse.x;
            this.mouse.vy = newY - this.mouse.y;
            this.mouse.x = newX;
            this.mouse.y = newY;

            angle += this.options.autoSpeed * 0.02;

            this.autoDemoTimer = requestAnimationFrame(demo);
        };

        demo();
    }

    stopAutoDemo() {
        this.autoDemoActive = false;
        if (this.autoDemoTimer) {
            cancelAnimationFrame(this.autoDemoTimer);
        }
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // Apply mouse force
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.options.cursorSize * this.options.resolution) {
                const force = (1 - distance / (this.options.cursorSize * this.options.resolution)) * this.options.mouseForce;
                const angle = Math.atan2(dy, dx);

                particle.vx += Math.cos(angle) * force * 0.01;
                particle.vy += Math.sin(angle) * force * 0.01;

                // Scale particle based on distance
                const scale = 1 + (1 - distance / (this.options.cursorSize * this.options.resolution)) * 0.5;
                particle.radius = particle.originalRadius * scale;
            } else {
                particle.radius += (particle.originalRadius - particle.radius) * 0.1;
            }

            // Apply viscous damping
            if (this.options.isViscous) {
                particle.vx *= (1 - this.options.viscous * 0.001);
                particle.vy *= (1 - this.options.viscous * 0.001);
            } else {
                particle.vx *= 0.98;
                particle.vy *= 0.98;
            }

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off walls
            if (this.options.isBounce) {
                if (particle.x < particle.radius || particle.x > this.canvas.width - particle.radius) {
                    particle.vx *= -0.8;
                    particle.x = Math.max(particle.radius, Math.min(this.canvas.width - particle.radius, particle.x));
                }
                if (particle.y < particle.radius || particle.y > this.canvas.height - particle.radius) {
                    particle.vy *= -0.8;
                    particle.y = Math.max(particle.radius, Math.min(this.canvas.height - particle.radius, particle.y));
                }
            } else {
                // Wrap around edges
                if (particle.x < 0) particle.x = this.canvas.width;
                if (particle.x > this.canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = this.canvas.height;
                if (particle.y > this.canvas.height) particle.y = 0;
            }
        });
    }

    drawParticles() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.particles.forEach((particle, i) => {
            this.particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100 * this.options.resolution) {
                    const opacity = (1 - distance / (100 * this.options.resolution)) * 0.3;

                    // Create gradient for connection
                    const gradient = this.ctx.createLinearGradient(
                        particle.x, particle.y, otherParticle.x, otherParticle.y
                    );
                    gradient.addColorStop(0, particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
                    gradient.addColorStop(1, otherParticle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));

                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.stroke();
                }
            });
        });

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Add glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = particle.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.stopAutoDemo();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Export for use
window.LiquidEther = LiquidEther;