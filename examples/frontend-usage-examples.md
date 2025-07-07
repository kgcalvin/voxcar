# Frontend Usage Examples

This file contains examples of how to display the AI-processed car descriptions on the frontend.

## React Component Example

```tsx
import React from 'react';

interface CarDescriptionProps {
  description: string;
  className?: string;
}

const CarDescription: React.FC<CarDescriptionProps> = ({
  description,
  className = '',
}) => {
  // If description is empty, show a placeholder
  if (!description || description.trim() === '') {
    return (
      <div className={`car-description ${className}`}>
        <p>No description available for this vehicle.</p>
      </div>
    );
  }

  return (
    <div
      className={`car-description ${className}`}
      dangerouslySetInnerHTML={{ __html: description }}
    />
  );
};

export default CarDescription;
```

## Usage in React Component

```tsx
import CarDescription from './CarDescriptionComponent';

function CarDetailPage({ car }) {
  return (
    <div className="car-detail">
      <h1>
        {car.year} {car.make} {car.model}
      </h1>
      <div className="car-price">${car.price}</div>

      {/* Display the formatted description */}
      <CarDescription
        description={car.description}
        className="car-detail-description"
      />
    </div>
  );
}
```

## Vue.js Example

```vue
<template>
  <div class="car-detail">
    <h1>{{ car.year }} {{ car.make }} {{ car.model }}</h1>
    <div class="car-price">${{ car.price }}</div>

    <!-- Display the formatted description -->
    <div
      class="car-description car-detail-description"
      v-html="car.description"
    ></div>
  </div>
</template>

<script>
export default {
  props: {
    car: {
      type: Object,
      required: true,
    },
  },
};
</script>
```

## Angular Example

```typescript
// car-description.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-car-description',
  template: `
    <div
      class="car-description"
      [innerHTML]="description || 'No description available for this vehicle.'"
    ></div>
  `,
  styleUrls: ['./car-description.component.css'],
})
export class CarDescriptionComponent {
  @Input() description: string = '';
}
```

```html
<!-- car-detail.component.html -->
<div class="car-detail">
  <h1>{{ car.year }} {{ car.make }} {{ car.model }}</h1>
  <div class="car-price">${{ car.price }}</div>

  <!-- Display the formatted description -->
  <app-car-description
    [description]="car.description"
    class="car-detail-description"
  ></app-car-description>
</div>
```

## Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/car-description.css" />
  </head>
  <body>
    <div class="car-detail">
      <h1 id="car-title"></h1>
      <div id="car-price"></div>
      <div id="car-description" class="car-description"></div>
    </div>

    <script>
      // Example car data from API
      const car = {
        year: '2020',
        make: 'Toyota',
        model: 'Camry',
        price: '25,000',
        description:
          '<h3>Overview</h3><p>Well-maintained 2020 Toyota Camry...</p>',
      };

      // Display car information
      document.getElementById('car-title').textContent =
        `${car.year} ${car.make} ${car.model}`;
      document.getElementById('car-price').textContent = `$${car.price}`;
      document.getElementById('car-description').innerHTML = car.description;
    </script>
  </body>
</html>
```

## CSS Integration

Make sure to include the CSS file in your project:

```html
<link rel="stylesheet" href="/car-description.css" />
```

Or import it in your CSS/SCSS:

```scss
@import '/car-description.css';
```

## Important Notes

1. **Security**: When using `innerHTML` or `dangerouslySetInnerHTML`, ensure the HTML content is from a trusted source (your API)
2. **Styling**: The provided CSS will style the formatted descriptions with proper spacing and typography
3. **Responsive**: The CSS includes responsive design for mobile devices
4. **Accessibility**: The HTML structure includes proper heading hierarchy (h3 tags)
