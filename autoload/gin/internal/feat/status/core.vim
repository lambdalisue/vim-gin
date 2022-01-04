function! gin#internal#feat#status#core#init() abort
  call gin#internal#core#action#core#init()
  call gin#internal#feat#status#action#register()
endfunction

