

const parseCheckInDate = (dateString) => {
  const date = new Date(
    parseInt(dateString.slice(0, 4)),  // year
    parseInt(dateString.slice(4, 6)) - 1,  // month (0-indexed)
    parseInt(dateString.slice(6, 8)),  // day
    13, 0, 0  // 13:00:00
    );   
    console.log('date to convert--:', date);
    console.log('date to convert-- to Iso:', date.toISOString());
    return date.toISOString();
    
    
}

const parseCheckOutDate = (dateString) => {
  const date = new Date(
    parseInt(dateString.slice(0, 4)),  // year
    parseInt(dateString.slice(4, 6)) - 1,  // month (0-indexed)
    parseInt(dateString.slice(6, 8)),  // day
    11, 0, 0  // 11:00:00
    );   
    console.log('date to convert--:', date);
    console.log('date to convert-- to Iso:', date.toISOString());
  return date.toISOString();
}
        
const nightsBetweenDates = (checkInDateISO, checkOutDateISO) => {
  const checkInDate = new Date (checkInDateISO);
  const checkOutDate = new Date (checkOutDateISO);

  //  difference in milliseconds
  const diffInMs = checkOutDate - checkInDate;

  //  milliseconds to days (1 day = 24 * 60 * 60 * 1000 ms)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24) + 2;

  return Math.floor(diffInDays); 
}

module.exports = { parseCheckInDate, parseCheckOutDate, nightsBetweenDates } 