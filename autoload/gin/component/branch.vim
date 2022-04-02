function! gin#component#branch#ascii() abort
  let component = 'component:branch:ascii'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction

function! gin#component#branch#unicode() abort
  let component = 'component:branch:unicode'
  call gin#internal#component#init(component)
  return gin#internal#component#get(component)
endfunction
