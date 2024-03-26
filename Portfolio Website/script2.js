const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray;

// Create particle class
class Particle {
  constructor(x, y, directionX, directionY, size, color) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.size = size;
    this.color = color;
  }

  // Method to draw individual particle
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  // Method to update particle's position
  update() {
    // Check if particle is within canvas boundaries
    if (this.x + this.size > canvas.width || this.x - this.size < 0) {
      this.directionX = -this.directionX;
    }
    if (this.y + this.size > canvas.height || this.y - this.size < 0) {
      this.directionY = -this.directionY;
    }

    // Move particle
    this.x += this.directionX;
    this.y += this.directionY;

    // Draw particle
    this.draw();
  }
}

// Function to create particles
function init() {
  particlesArray = [];
  for (let i = 0; i < 100; i++) {
    const size = Math.random() + 1;
    const x = Math.random() * (window.innerWidth - size * 2) + size;
    const y = Math.random() * (window.innerHeight - size * 2) + size;
    const directionX = (Math.random() - 0.5) * 0.5;
    const directionY = (Math.random() - 0.5) * 0.5;
    const color = '#ffffff';

    particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
  }
}

// Function to animate particles
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let i = 0; i < particlesArray.length; i++) {
    const particle = particlesArray[i];

    const distanceToCenter = Math.sqrt(
      (particle.x - centerX) * (particle.x - centerX) +
      (particle.y - centerY) * (particle.y - centerY)
    );

    // Opacity based on distance to center
    const opacity = 1 - distanceToCenter / maxDistance;

    // Set opacity
    ctx.globalAlpha = opacity < 0.2 ? 0.2 : opacity;

    particle.update();
  }

  // Reset globalAlpha for other drawings
  ctx.globalAlpha = 1;
}

// Resize canvas on window resize
window.addEventListener('resize', function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  init();
});

function drawdots() {
  init();
  animate();
}

drawdots();




