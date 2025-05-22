// Sample text from Perplexity
const perplexityText = `NSX enthusiasts often express interest in or own other performance-oriented and enthusiast cars, with a notable inclination towards Porsche models [1][2][3].

Common cars liked or owned by NSX enthusiasts include:
*   **Porsche 911**: Frequently mentioned as an alternative or a stablemate, valued for its performance and exotic appeal [1][2][3]. Specific models like the 993 generation are owned by NSX drivers [3].
*   **Porsche Cayman S**: Another Porsche model found in an NSX owner's collection [3].
*   **C8 Corvette**: Recognized for its mid-engine layout and supercar-level performance at a competitive price point [1].
*   **Alfa Romeo 4C**: Listed as a garage companion to an NSX [3].
*   **Lotus models**: Mentioned in discussions as desirable driver's cars, similar in spirit to the NSX [5].
*   **BMW M3**: Also noted as a desirable driver's car in enthusiast circles [5].

While not specific to NSX owners, broader car enthusiast trends indicate common pairings of a sports car with a more practical vehicle like an SUV or a reliable daily driver [4]. For instance, combinations such as a sports car (like a Porsche, M-series BMW, or AMG Mercedes) alongside an SUV are popular [4]. Other enthusiasts pair a fun, smaller car like a Mazda Miata with a more rugged vehicle like a Toyota Land Cruiser, Tacoma, or 4Runner [4].

Citations:
[1] https://www.reddit.com/r/nsx/comments/1gbauhk/what_other_cars_have_you_been_interested_in/
[2] https://www.nsxprime.com/threads/prospective-owner-question-is-the-nsx-too-rare-valuable-now-to-drive-and-enjoy.215780/
[3] https://www.nsxprime.com/threads/nsx-garage-stable-mates.215024/
[4] https://www.reddit.com/r/cars/comments/1kla49y/what_cars_do_you_see_commonly_owned_together_by/
[5] https://www.nsxprime.com/threads/cars-driven-and-comparisons.5244/
[6] https://www.theautopian.com/driving-an-old-acura-nsx-is-a-wonderful-assault-on-nearly-all-of-your-senses/
[7] https://www.mcgrathacuralibertyville.com/blog/will-acura-bring-back-the-iconic-nsx
[8] https://www.youtube.com/watch?v=DQDD1zaaw6Y
[9] https://www.nsxprime.com/threads/the-best-sports-car-the-world-has-ever-produced-any-time-any-place-any-price.6468/
[10] https://www.youtube.com/watch?v=tjHjVWlkiBE`;

/**
 * Convert Perplexity text to Slack-formatted text
 * @param {string} text - The Perplexity text to convert
 * @returns {string} - The Slack-formatted text
 */
function convertPerplexityToSlack(text) {
  // Remove citations section
  const citationsIndex = text.indexOf('Citations:');
  if (citationsIndex !== -1) {
    text = text.substring(0, citationsIndex).trim();
  }
  
  // Remove citation references like [1], [2], etc.
  text = text.replace(/\s?\[\d+\](?:\[\d+\])*\s?/g, ' ');
  
  // Process the text line by line
  const lines = text.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line) {
      // Keep empty lines for paragraph separation
      result.push('');
      continue;
    }
    
    // Check for bullet point items
    if (line.match(/^\*\s+\*\*.*\*\*:/) || line.startsWith('*   **')) {
      // This is a bullet point with bold text in Perplexity format
      // Extract the bold part and the rest
      const boldMatch = line.match(/^\*\s+\*\*(.*?)\*\*:(.*)/);
      if (boldMatch) {
        const [_, boldText, restOfText] = boldMatch;
        result.push(`- *${boldText}*:${restOfText}`);
      } else {
        // Try another pattern
        const altBoldMatch = line.match(/^\*\s+\*\*(.*?)\*\*(.*)/);
        if (altBoldMatch) {
          const [_, boldText, restOfText] = altBoldMatch;
          result.push(`- *${boldText}*${restOfText}`);
        } else {
          // If no match, just format as a bullet
          result.push(`- ${line.replace(/^\*\s+/, '')}`);
        }
      }
      continue;
    }
    
    // Check for headers (short lines with a colon)
    if (line.includes(':') && line.indexOf(':') < 40 && line.length < 80) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        result.push(`*${parts[0].trim()}:*${parts.slice(1).join(':')}`);
        continue;
      }
    }
    
    // Bold formatting
    line = line.replace(/\*\*(.*?)\*\*/g, '*$1*');
    
    // Regular text
    result.push(line);
  }
  
  return result.join('\n');
}

// Test the conversion
const slackFormatted = convertPerplexityToSlack(perplexityText);
console.log(slackFormatted);