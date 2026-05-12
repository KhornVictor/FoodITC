export const adsImageRotation = () => {
  const adsImages = [
    "https://img.freepik.com/free-psd/delicious-burger-food-menu-social-media-banner-instagram-post-template_120329-4851.jpg?semt=ais_hybrid&w=740&q=80",
    "https://www.app2food.com/blog/wp-content/uploads/2024/10/7-examples-of-food-advertisements-that-captivated-audiences-img-jpg.webp",
    "https://img.freepik.com/free-psd/fast-food-template-design_23-2150759668.jpg?semt=ais_hybrid&w=740&q=80",
    "https://cdn.dribbble.com/userupload/36755612/file/original-3dd7dc0eb155a293cac03b59b5d1ba08.gif",
    "https://mir-s3-cdn-cf.behance.net/project_modules/source/055010139310731.622da29e9d84f.gif"
  ];
  const intervalMs = 5000;
  const slider = document.getElementById("ads-slider");
  const currentSlide = document.getElementById("ads-image-current");
  const nextSlide = document.getElementById("ads-image-next");
  const dotsContainer = document.getElementById("ads-dots");
  const prevButton = slider?.querySelector(".ads-arrow-left");
  const nextButton = slider?.querySelector(".ads-arrow-right");
  const swipeThreshold = 80;
  let currentIndex = 0;
  let intervalId = null;
  let isPaused = false;
  let resumeTimeoutId = null;
  const resumeDelayMs = 3000;
  let startX = 0;
  let currentX = 0;
  let velocityX = 0;
  let lastMoveTime = 0;
  let isDragging = false;
  let isAnimating = false;
  let dragDirection = 1;
  let dragFrame = null;
  let pendingDeltaX = 0;

  if (!slider || !currentSlide || !nextSlide || !dotsContainer) return;

  const getWidth = () => slider.getBoundingClientRect().width || 1;

  const setSlidePositions = (deltaX, direction) => {
    // currentSlide.style.transform = `translate3d(${deltaX}px, 0, 0)`;
    const offset = direction === 1 ? deltaX + getWidth() : deltaX - getWidth();
    // nextSlide.style.transform = `translate3d(${offset}px, 0, 0)`;
  };

  const setSlideImages = (nextIndex) => {
    currentSlide.src = adsImages[currentIndex];
    nextSlide.src = adsImages[nextIndex];
  };

  const normalizeIndex = (index) =>
    (index + adsImages.length) % adsImages.length;

  const updateDots = () => {
    const dots = dotsContainer.querySelectorAll(".ads-dot");
    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentIndex);
    });
  };

  const renderDots = () => {
    dotsContainer.innerHTML = "";
    adsImages.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "ads-dot";
      dot.setAttribute("aria-label", `Go to ad ${index + 1}`);
      dot.addEventListener("click", () => {
        if (index === currentIndex || isAnimating) return;
        const direction = index > currentIndex ? 1 : -1;
        setSlideImages(index);
        goToIndex(index, direction);
        resetInterval();
      });
      dotsContainer.appendChild(dot);
    });
    updateDots();
  };

  const goToIndex = (nextIndex, direction) => {
    if (isAnimating) return;
    isAnimating = true;
    const width = getWidth();
    const target = direction === 1 ? -width : width;
    nextSlide.classList.remove("is-dragging");
    currentSlide.classList.remove("is-dragging");
    currentSlide.style.transition = "transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)";
    nextSlide.style.transition = "transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)";
    setSlidePositions(target, direction);
    window.setTimeout(() => {
      currentIndex = normalizeIndex(nextIndex);
      const followingIndex = normalizeIndex(
        currentIndex + (direction === 1 ? 1 : -1),
      );
      setSlideImages(followingIndex);
      setSlidePositions(0, direction);
      currentSlide.style.transition = "";
      nextSlide.style.transition = "";
      updateDots();
      isAnimating = false;
    }, 480);
  };

  const resetInterval = () => {
    if (intervalId) {
      window.clearInterval(intervalId);
    }
    if (isPaused) return;
    intervalId = window.setInterval(() => {
      const nextIndex = normalizeIndex(currentIndex + 1);
      setSlideImages(nextIndex);
      goToIndex(nextIndex, 1);
    }, intervalMs);
  };

  const scheduleResume = () => {
    if (resumeTimeoutId) {
      window.clearTimeout(resumeTimeoutId);
    }
    resumeTimeoutId = window.setTimeout(() => {
      isPaused = false;
      resetInterval();
    }, resumeDelayMs);
  };

  setSlideImages(normalizeIndex(currentIndex + 1));
  setSlidePositions(0, 1);
  renderDots();
  resetInterval();

  slider.addEventListener("mouseenter", () => {
    isPaused = true;
    if (intervalId) {
      window.clearInterval(intervalId);
    }
  });

  slider.addEventListener("mouseleave", () => {
    scheduleResume();
  });

  slider.addEventListener("pointerdown", (event) => {
    if (isAnimating) return;
    isDragging = true;
    isPaused = true;
    startX = event.clientX;
    currentX = startX;
    velocityX = 0;
    lastMoveTime = performance.now();
    currentSlide.classList.add("is-dragging");
    nextSlide.classList.add("is-dragging");
    slider.setPointerCapture(event.pointerId);
    resetInterval();
  });

  slider.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const now = performance.now();
    const nextX = event.clientX;
    const deltaTime = Math.max(1, now - lastMoveTime);
    velocityX = (nextX - currentX) / deltaTime;
    currentX = nextX;
    lastMoveTime = now;
    const deltaX = currentX - startX;
    const direction = deltaX < 0 ? 1 : -1;
    if (direction !== dragDirection) {
      dragDirection = direction;
      const nextIndex = normalizeIndex(currentIndex + dragDirection);
      setSlideImages(nextIndex);
    }
    pendingDeltaX = deltaX;
    if (dragFrame) return;
    dragFrame = window.requestAnimationFrame(() => {
      setSlidePositions(pendingDeltaX, dragDirection);
      dragFrame = null;
    });
  });

  slider.addEventListener("pointerup", (event) => {
    if (!isDragging) return;
    isDragging = false;
    const deltaX = currentX - startX;
    const direction = deltaX < 0 ? 1 : -1;
    const absDelta = Math.abs(deltaX);
    const momentum = Math.abs(velocityX) > 0.5;
    if (absDelta >= swipeThreshold || momentum) {
      const nextIndex = normalizeIndex(currentIndex + direction);
      goToIndex(nextIndex, direction);
    } else {
      currentSlide.style.transition = "transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)";
      nextSlide.style.transition = "transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)";
      setSlidePositions(0, direction);
      window.setTimeout(() => {
        currentSlide.style.transition = "";
        nextSlide.style.transition = "";
      }, 480);
      currentSlide.classList.remove("is-dragging");
      nextSlide.classList.remove("is-dragging");
    }

    if (event.pointerType === "touch") {
      scheduleResume();
    } else {
      isPaused = false;
      resetInterval();
    }
  });

  slider.addEventListener("pointercancel", () => {
    if (!isDragging) return;
    isDragging = false;
    setSlidePositions(0, 1);
    currentSlide.classList.remove("is-dragging");
    nextSlide.classList.remove("is-dragging");
  });

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      const nextIndex = normalizeIndex(currentIndex - 1);
      setSlideImages(nextIndex);
      goToIndex(nextIndex, -1);
      resetInterval();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const nextIndex = normalizeIndex(currentIndex + 1);
      setSlideImages(nextIndex);
      goToIndex(nextIndex, 1);
      resetInterval();
    });
  }
};
