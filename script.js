// FAQ toggle function
function toggleFaqNonduality(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    
    // Close all other FAQs
    const allFaqs = document.querySelectorAll('.nonduality-wrapper .faq-item');
    allFaqs.forEach(faq => {
      if (faq !== faqItem && faq.classList.contains('active')) {
        faq.classList.remove('active');
        faq.querySelector('.faq-answer').classList.remove('active');
      }
    });
    
    // Toggle current FAQ
    faqItem.classList.toggle('active');
    answer.classList.toggle('active');
  }