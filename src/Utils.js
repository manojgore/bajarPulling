export function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  
  const diffInSeconds = Math.floor((now - date) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second'); // Less than a minute ago
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute'); // Less than an hour ago
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour'); // Less than a day ago
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return rtf.format(-diffInDays, 'day'); // More than a day ago
}