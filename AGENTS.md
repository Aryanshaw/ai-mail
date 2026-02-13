# AGENTS.md

- On frontend when ever we create buttons always add "cursor-pointer" to all the buttons
- In tailwind never write colors like this 'bg-[radial-gradient(110%_85%_at_50%_10%,rgba(21,57,130,0.22),rgba(4,8,20,0.72)_48%,rgba(2,5,12,0.9)_100%)]' always create a custom tailwind class in global.css and use that always
- Whenever making an edits on a component always think about both dark / light theme view
- On frontend always break big components into new custom component files and use that for refactoring , and add comments
- For fonts always stick to inter for minimilist and asthetic look , and if texts are subtitles add line breaks
- on frontend always use axios or our own axios interceptor and in backend use aiohttp
- Wrap api calls and server handlers in try catch and in the catch block add a print line
- When printing errors always also add the name of the function which throws error