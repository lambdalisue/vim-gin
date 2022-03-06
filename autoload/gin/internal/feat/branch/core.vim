function! gin#internal#feat#branch#core#init() abort
  call gin#internal#core#action#core#init()
  call gin#internal#feat#branch#action#register()
endfunction
