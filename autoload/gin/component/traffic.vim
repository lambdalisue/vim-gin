function! gin#component#traffic#ascii(...) abort
  try
    let cwd = a:0 ? a:1 : ''
    return denops#request('gin', 'component:traffic:ascii', [cwd])
  catch
    return ""
  endtry
endfunction

function! gin#component#traffic#unicode(...) abort
  try
    let cwd = a:0 ? a:1 : ''
    return denops#request('gin', 'component:traffic:unicode', [cwd])
  catch
    return ""
  endtry
endfunction
