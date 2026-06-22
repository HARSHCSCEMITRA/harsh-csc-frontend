const fs = require('fs');
let content = fs.readFileSync('public/admin.html', 'utf8');

const replacements = [
  {
    target: "showToast('Koi cancelled order nahi hai', 'info')",
    replacement: "showToast('There are no cancelled orders.', 'info')"
  },
  {
    target: "showConfirm('🗑️', 'Delete Order?', `Order ${ref} permanently delete ho jayega!`, async () => {",
    replacement: "showConfirm('🗑️', 'Delete Order?', `Order ${ref} will be permanently deleted!`, async () => {"
  },
  {
    target: "showConfirm('🗑️', 'Delete All Cancelled?', `${total} cancelled orders permanently delete ho jayenge!`, async () => {",
    replacement: "showConfirm('🗑️', 'Delete All Cancelled?', `${total} cancelled orders will be permanently deleted!`, async () => {"
  },
  {
    target: "showConfirm('🗑️', 'Delete Consultation?', 'Yeh consultation permanently delete ho jayegi!', async () => {",
    replacement: "showConfirm('🗑️', 'Delete Consultation?', 'This consultation will be permanently deleted!', async () => {"
  },
  {
    target: "showConfirm('🗑️','Delete Product?',`\"${p.name}\" permanently delete ho jayega!`, async () => {",
    replacement: "showConfirm('🗑️','Delete Product?',`\"${p.name}\" will be permanently deleted!`, async () => {"
  },
  {
    target: "if (!confirm('Sare custom fields hat jayenge aur default fields wapas aayenge. Confirm?')) return;",
    replacement: "if (!confirm('All custom fields will be removed and default fields will be restored. Confirm?')) return;"
  },
  {
    target: "showToast('✅ Reset ho gaya — Default fields wapas aa gaye!', 'success')",
    replacement: "showToast('✅ Reset successful — Default fields restored!', 'success')"
  },
  {
    target: "required:confirm('Kya yeh field required (zaroori) hai?'),",
    replacement: "required:confirm('Is this field required?'),"
  },
  {
    target: "placeholder:type!=='file'&&type!=='date'&&type!=='checkbox' ? label.trim()+' dalein' : ''",
    replacement: "placeholder:type!=='file'&&type!=='date'&&type!=='checkbox' ? 'Enter ' + label.trim() : ''"
  },
  {
    target: "showToast(`✅ \"${label.trim()}\" field add ho gaya!`, 'success')",
    replacement: "showToast(`✅ Field \"${label.trim()}\" has been added!`, 'success')"
  },
  {
    target: "showToast(`✅ \"${label}\" add ho gaya!`, 'success')",
    replacement: "showToast(`✅ \"${label}\" has been added!`, 'success')"
  },
  {
    target: "showToast('✅ Field update ho gaya!', 'success')",
    replacement: "showToast('✅ Field updated successfully!', 'success')"
  },
  {
    target: "if (!confirm(`\"${fields[i]?.label}\" delete karna chahte ho?`)) return;",
    replacement: "if (!confirm(`Are you sure you want to delete \"${fields[i]?.label}\"?`)) return;"
  },
  {
    target: "showToast('✅ Form fields Supabase mein save ho gaye!', 'success')",
    replacement: "showToast('✅ Form fields saved to Supabase successfully!', 'success')"
  },
  {
    target: "showToast('⚠️ Pehle koi service select karo', 'error')",
    replacement: "showToast('⚠️ Please select a service first', 'error')"
  },
  {
    target: "showToast('⚠️ Customer name zaroori hai', 'error')",
    replacement: "showToast('⚠️ Customer name is required', 'error')"
  },
  {
    target: "showToast('⚠️ Review text zaroori hai', 'error')",
    replacement: "showToast('⚠️ Review text is required', 'error')"
  },
  {
    target: "showConfirm('🗑️', 'Delete Review?', 'Yeh review permanently delete ho jayega!', async () => {",
    replacement: "showConfirm('🗑️', 'Delete Review?', 'This review will be permanently deleted!', async () => {"
  },
  {
    target: "showToast('Kripya software version likhein (e.g. 1.0.0).', 'error')",
    replacement: "showToast('Please enter the software version (e.g., 1.0.0).', 'error')"
  },
  {
    target: "showToast('Unauthorized. Kripya login karein.', 'error')",
    replacement: "showToast('Unauthorized. Please log in first.', 'error')"
  },
  {
    target: "onclick=\"showToast('Kripya pehle email address edit karke add karein.', 'error')\"",
    replacement: "onclick=\"showToast('Please edit the customer details to add an email address first.', 'error')\""
  },
  {
    target: "showToast('Customer name aur phone number required hai.', 'error')",
    replacement: "showToast('Customer name and phone number are required.', 'error')"
  },
  {
    target: "if (!confirm(`Kya aap ye license key ${action} karna chahte hain?`)) return;",
    replacement: "if (!confirm(`Are you sure you want to ${action} this license key?`)) return;"
  },
  {
    target: "if (!confirm('Kya aap ye trial delete karna chahte hain? Ye action undo nahi hoga.')) return;",
    replacement: "if (!confirm('Are you sure you want to delete this trial? This action cannot be undone.')) return;"
  },
  {
    target: "if (!confirm('Kya aap is customer ko license key details ka email bhejna chahte hain?')) return;",
    replacement: "if (!confirm('Are you sure you want to send the license key details email to this customer?')) return;"
  },
  {
    target: "showToast('Customer Name aur Phone Number field required hai.', 'error')",
    replacement: "showToast('Customer Name and Phone Number fields are required.', 'error')"
  },
  {
    target: "showToast('Export karne ke liye koi data nahi hai.', 'error')",
    replacement: "showToast('There is no data available to export.', 'error')"
  },
  {
    target: "showToast('Filtered data empty hai. Export nahi kiya ja sakta.', 'error')",
    replacement: "showToast('Filtered data is empty. Export cannot be performed.', 'error')"
  },
  {
    target: "if (!msg)  { showToast('⚠️ Message likhna zaroori hai', 'error'); return; }",
    replacement: "if (!msg)  { showToast('⚠️ Message body cannot be empty', 'error'); return; }"
  },
  {
    target: "if (!numbers.length) { showToast('⚠️ Koi recipients nahi mila', 'error'); return; }",
    replacement: "if (!numbers.length) { showToast('⚠️ No valid recipients found', 'error'); return; }"
  },
  {
    target: "showConfirm('📣', 'Bulk WhatsApp Bhejo?',",
    replacement: "showConfirm('📣', 'Send Bulk WhatsApp?',"
  },
  {
    target: "showToast(`✅ ${numbers.length} WhatsApp tabs khulee!`, 'success')",
    replacement: "showToast(`✅ Opened ${numbers.length} WhatsApp message tabs successfully!`, 'success')"
  },
  {
    target: "if (!coupons.length) { showToast('⚠️ Pehle Coupons page se coupon banao', 'error'); return; }",
    replacement: "if (!coupons.length) { showToast('⚠️ Please create a coupon on the Coupons page first', 'error'); return; }"
  },
  {
    target: "if (!mobile) { showToast('⚠️ Customer ka mobile number nahi hai', 'error'); return; }",
    replacement: "if (!mobile) { showToast('⚠️ Customer mobile number is missing', 'error'); return; }"
  },
  {
    target: "showConfirm('🗑️', 'Delete Cart?', 'Yeh saved cart delete ho jayegi!', async () => {",
    replacement: "showConfirm('🗑️', 'Delete Cart?', 'This saved cart will be deleted!', async () => {"
  },
  {
    target: "showToast('✅ Billing settings save ho gayi!', 'success')",
    replacement: "showToast('✅ Billing settings saved successfully!', 'success')"
  },
  {
    target: "if (!id && cps.find(c=>c.code===code)) { showToast('Yeh code pehle se exist karta hai!','error'); return; }",
    replacement: "if (!id && cps.find(c=>c.code===code)) { showToast('This coupon code already exists!','error'); return; }"
  },
  {
    target: "showConfirm('🗑️','Delete Coupon?',`\"${c.code}\" delete ho jayega!`,()=>{ setCoupons(getCoupons().filter(x=>x.id!==id)); renderCoupons(); showToast('🗑️ Coupon deleted','info'); });",
    replacement: "showConfirm('🗑️','Delete Coupon?',`\"${c.code}\" will be permanently deleted!`,()=>{ setCoupons(getCoupons().filter(x=>x.id!==id)); renderCoupons(); showToast('🗑️ Coupon deleted','info'); });"
  },
  {
    target: "if (!id && staff.find(s=>s.username===user)) { showToast('Yeh username pehle se hai!','error'); return; }",
    replacement: "if (!id && staff.find(s=>s.username===user)) { showToast('This username is already taken!','error'); return; }"
  },
  {
    target: "showConfirm('🗑️','Delete Staff?',`\"${s.name}\" ka account delete ho jayega!`,()=>{ setStaff(getStaff().filter(x=>x.id!==id)); renderStaff(); showToast('🗑️ Staff deleted','info'); });",
    replacement: "showConfirm('🗑️','Delete Staff?',`The account for \"${s.name}\" will be permanently deleted!`,()=>{ setStaff(getStaff().filter(x=>x.id!==id)); renderStaff(); showToast('🗑️ Staff deleted','info'); });"
  },
  {
    target: "showConfirm('🗑️','Delete Document?','Yeh document permanently delete ho jayega!',()=>{ setDocs(getDocs().filter(x=>x.id!==id)); renderDocs(); showToast('🗑️ Document deleted','info'); });",
    replacement: "showConfirm('🗑️','Delete Document?','This document will be permanently deleted!',()=>{ setDocs(getDocs().filter(x=>x.id!==id)); renderDocs(); showToast('🗑️ Document deleted','info'); });"
  },
  {
    target: "if (!key || !from) { showToast('Pehle Email Config save karo!', 'error'); return; }",
    replacement: "if (!key || !from) { showToast('Please save your Email Configuration first!', 'error'); return; }"
  },
  {
    target: "showToast('📧 Test email bhej raha hai...', 'info')",
    replacement: "showToast('📧 Sending test email...', 'info')"
  },
  {
    target: "if (r.success) showToast('✅ Test email sent! Inbox check karo.', 'success');",
    replacement: "if (r.success) showToast('✅ Test email sent! Please check your inbox.', 'success');"
  },
  {
    target: "showToast('❌ Edge Function connect nahi ho raha. Deploy karo pehle.', 'error')",
    replacement: "showToast('❌ Edge Function connection failed. Please deploy it first.', 'error')"
  }
];

let replacedCount = 0;
replacements.forEach(rep => {
  if (content.includes(rep.target)) {
    content = content.replace(rep.target, rep.replacement);
    replacedCount++;
  } else {
    console.log(`⚠️ TARGET NOT FOUND: ${rep.target}`);
  }
});

fs.writeFileSync('public/admin.html', content, 'utf8');
console.log(`Successfully applied ${replacedCount} replacements out of ${replacements.length}!`);
