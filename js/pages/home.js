// import Carousel from '../components/ui/Carousel.mjs';

function Home(content) {
  // const images = [
  //   'https://i.pinimg.com/736x/f5/a6/92/f5a692d40734225d8712bf24cc1938e5.jpg',
  //   'https://i.pinimg.com/736x/ca/99/04/ca9904671537679701ba7cd582b4f9a8.jpg',
  //   'https://i.pinimg.com/736x/eb/d6/76/ebd6762d60db3f885832d3e48b688d73.jpg',
  // ];

  // const carousel = Carousel(images);
  // content.appendChild(carousel);


  const tabs = [
    { label: 'Food', contentLoader: loadFoodContent },
    { label: 'Shopping', contentLoader: loadShoppingContent },
    { label: 'Services', contentLoader: loadServicesContent },
    { label: 'Entertainment', contentLoader: loadEntertainmentContent },
    { label: 'Healthcare', contentLoader: loadHealthcareContent },
  ];

  // Attach the tabbed interface to the content container
  content.appendChild(createTabbedInterface(tabs));
}

function createTabbedInterface(tabs) {
  const container = document.createElement('div');
  container.className = 'tab-container';

  const tabList = document.createElement('ul');
  tabList.className = 'tab-buttons';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'tabcontent';

  tabs.forEach(({ label, contentLoader }, index) => {
    const tab = document.createElement('li');
    tab.className = 'tab-button';
    tab.textContent = label;
    tab.dataset.index = index;

    // Handle tab click
    tab.addEventListener('click', async () => {
      // Remove 'active' class from all tabs
      Array.from(tabList.children).forEach((t) => t.classList.remove('active'));
      // Add 'active' class to the clicked tab
      tab.classList.add('active');

      // Clear previous content
      contentContainer.innerHTML = '';

      // Load content for the clicked tab
      const content = await contentLoader();
      contentContainer.appendChild(content);
    });

    // Set the first tab as active by default
    if (index === 0) {
      tab.classList.add('active');
      contentLoader().then((content) => {
        contentContainer.appendChild(content);
      });
    }

    tabList.appendChild(tab);
  });

  container.appendChild(tabList);
  container.appendChild(contentContainer);

  return container;
}

// Category-specific content loaders
async function loadFoodContent() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="grid">
      <div class="card"><h3>Restaurants</h3><p>Explore nearby dining options</p></div>
      <div class="card"><h3>Cafes</h3><p>Relax with a coffee</p></div>
      <div class="card"><h3>Bars</h3><p>Enjoy nightlife</p></div>
    </div>`;
  return div;
}

async function loadShoppingContent() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="grid">
      <div class="card"><h3>Grocery Stores</h3><p>Shop for daily essentials</p></div>
      <div class="card"><h3>Malls</h3><p>Find everything in one place</p></div>
    </div>`;
  return div;
}

async function loadServicesContent() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="grid">
      <div class="card"><h3>Salons</h3><p>Look your best</p></div>
      <div class="card"><h3>Repair Services</h3><p>Fix what’s broken</p></div>
    </div>`;
  return div;
}

async function loadEntertainmentContent() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="grid">
      <div class="card"><h3>Movie Theaters</h3><p>Catch the latest movies</p></div>
      <div class="card"><h3>Parks</h3><p>Enjoy the outdoors</p></div>
    </div>`;
  return div;
}

async function loadHealthcareContent() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="grid">
      <div class="card"><h3>Hospitals</h3><p>Healthcare nearby</p></div>
      <div class="card"><h3>Pharmacies</h3><p>Medicine and more</p></div>
    </div>`;
  return div;
}

export { Home };
