# How to Add or Edit Client Reviews

Reviews are stored in **index.html** in the **Client Reviews & Rating** section.

## Where to open

1. Open the file **`index.html`** in your portfolio folder.
2. Press **Ctrl+F** (or **Cmd+F** on Mac) and search for: **Client Reviews**
3. You will see the section that contains all review cards.

## What to edit in each review

Each review card has **3 text parts** you can change:

| What to change | Where in the code | Example |
|----------------|-------------------|--------|
| **The review quote** | Text inside `<blockquote class="review-text">` and `</blockquote>` | "Qasim delivered an excellent e-commerce app..." |
| **Client name** | Text inside `<span class="review-name">` and `</span>` | "Sarah M." |
| **Role or location** | Text inside `<span class="review-role">` and `</span>` | "Startup Founder, USA" |

## To edit an existing review

1. Find the review card you want to change.
2. Replace only the text between the tags:
   - Change the sentence inside `<blockquote class="review-text"> ... </blockquote>` to the client’s words.
   - Change `<span class="review-name">Sarah M.</span>` to the client’s name.
   - Change `<span class="review-role">Startup Founder, USA</span>` to their role or country (e.g. "Upwork Client, USA").

## To add a new review (copy-paste)

1. Find one full review card. It starts with `<div class="review-card fade-in">` and ends with `</div>` (the one that closes the card, not the grid).
2. **Copy** that entire block (all lines from `<div class="review-card fade-in">` down to its closing `</div>`).
3. **Paste** it right after another review card, but **before** the line that says `</div>` of `reviews-grid` (the closing `</div>` that comes after all cards).
4. Edit the pasted block: change the quote, review-name, and review-role to the new client’s review and details.

## Example of one full review card to copy

```html
                <div class="review-card fade-in">
                    <div class="review-stars" aria-label="5 out of 5 stars">
                        <span class="star filled" aria-hidden="true">★</span>
                        <span class="star filled" aria-hidden="true">★</span>
                        <span class="star filled" aria-hidden="true">★</span>
                        <span class="star filled" aria-hidden="true">★</span>
                        <span class="star filled" aria-hidden="true">★</span>
                    </div>
                    <blockquote class="review-text">
                        Paste the client's review text here.
                    </blockquote>
                    <div class="review-author">
                        <span class="review-name">Client Name</span>
                        <span class="review-role">Their role or country</span>
                    </div>
                </div>
```

Save **index.html** and refresh your website to see the changes.
