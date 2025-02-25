// src/components/Map/EventInfoWindow.tsx

interface EventInfoProps {
  title: string;
  description?: string;
}

export function createEventInfoContent(props: EventInfoProps, isDark: boolean): string {
  const { title, description = "This is a bndy event." } = props;
  
  // Theme-specific colors
  const bgColor = isDark ? '#1e293b' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#121212';
  
  return `
    <div class="bndy-event-card" style="
      background-color: ${bgColor}; 
      color: ${textColor};
      border-radius: 8px;
      padding: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      width: 220px;
      border: 2px solid #F97316;
      font-family: Arial, sans-serif;
    ">
      <div style="font-weight: bold; color: #F97316; margin-bottom: 8px; font-size: 16px;">
        ${title}
      </div>
      <div style="margin: 8px 0; font-size: 14px;">
        ${description}
      </div>
      <div style="font-size: 12px; color: #06B6D4; margin-top: 5px;">
        Click for details
      </div>
    </div>
  `;
}