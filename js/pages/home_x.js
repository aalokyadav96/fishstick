import Carousel from '../components/ui/Carousel.mjs';

function Home(content) {
  const images = [
    'https://i.pinimg.com/736x/f5/a6/92/f5a692d40734225d8712bf24cc1938e5.jpg',
    'https://i.pinimg.com/736x/ca/99/04/ca9904671537679701ba7cd582b4f9a8.jpg',
    'https://i.pinimg.com/736x/eb/d6/76/ebd6762d60db3f885832d3e48b688d73.jpg',
  ];

  const carousel = Carousel(images);
  content.appendChild(carousel);

  const tabs = [
    { label: 'Food & Dining', contentLoader: loadFoodContent },
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
  tabList.className = 'tab-list';

  const contentContainer = document.createElement('div');
  contentContainer.className = 'tabcontent';

  tabs.forEach(({ label, contentLoader }, index) => {
    const tab = document.createElement('li');
    tab.className = 'tab';
    tab.textContent = label;
    tab.dataset.index = index;

    // Handle tab click
    tab.addEventListener('click', async () => {
      Array.from(tabList.children).forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Clear previous content
      contentContainer.innerHTML = '';

      // Load content for the clicked tab
      const content = await contentLoader(contentContainer);
      contentContainer.appendChild(content);
    });

    if (index === 0) {
      tab.classList.add('active');
      contentLoader(contentContainer).then((content) => {
        contentContainer.appendChild(content);
      });
    }

    tabList.appendChild(tab);
  });

  container.appendChild(tabList);
  container.appendChild(contentContainer);

  return container;
}

async function createGrid(data, contentContainer) {
  const grid = document.createElement('div');
  grid.className = 'grid';

  data.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${item.title}</h3><p>${item.description}</p>`;

    // Add click listener to load services
    card.addEventListener('click', async () => {
      contentContainer.innerHTML = `<h2>${item.title}</h2>`;
      const services = await fetchServices(item.id);
      const serviceGrid = await createGrid(services, contentContainer);
      contentContainer.appendChild(serviceGrid);
    });

    grid.appendChild(card);
  });

  return grid;
}

async function fetchServices(categoryId) {
  // Mock API call for services in a category
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, title: 'Service A', description: 'Details about Service A' },
        { id: 2, title: 'Service B', description: 'Details about Service B' },
      ]);
    }, 500);
  });
}

// Example content loaders
async function loadFoodContent(contentContainer) {
  const foodData = [
    { id: 101, title: 'Restaurants', description: 'Find great dining places.' },
    { id: 102, title: 'Cafes', description: 'Cozy spots to relax.' },
    { id: 103, title: 'Bars', description: 'Enjoy nightlife and drinks.' },
  ];
  return createGrid(foodData, contentContainer);
}

async function loadShoppingContent(contentContainer) {
  const shoppingData = [
    { id: 201, title: 'Grocery Stores', description: 'Daily essentials near you.' },
    { id: 202, title: 'Malls', description: 'All-in-one shopping destinations.' },
  ];
  return createGrid(shoppingData, contentContainer);
}

async function loadServicesContent(contentContainer) {
  const servicesData = [
    { id: 301, title: 'Salons', description: 'Get your hair styled.' },
    { id: 302, title: 'Repair Services', description: 'Fix your appliances.' },
  ];
  return createGrid(servicesData, contentContainer);
}

async function loadEntertainmentContent(contentContainer) {
  const entertainmentData = [
    { id: 401, title: 'Movie Theaters', description: 'Watch the latest releases.' },
    { id: 402, title: 'Parks', description: 'Relax and enjoy nature.' },
  ];
  return createGrid(entertainmentData, contentContainer);
}

async function loadHealthcareContent(contentContainer) {
  const healthcareData = [
    { id: 501, title: 'Hospitals', description: 'Healthcare facilities near you.' },
    { id: 502, title: 'Pharmacies', description: 'Get your medications.' },
  ];
  return createGrid(healthcareData, contentContainer);
}

export { Home };
