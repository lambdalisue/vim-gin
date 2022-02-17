function! gin#internal#util#action#select_opener() abort
  let opener = input('Open with: ')
  redraw | echo ''
  if empty(opener)
    echohl WarningMsg
    echo 'Cancelled'
    echohl None
    return v:null
  endif
  return opener
endfunction
