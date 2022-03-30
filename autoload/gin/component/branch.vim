function! gin#component#branch#ascii(...) abort
  try
    let cwd = a:0 ? a:1 : ''
    return denops#request('gin', 'component:branch:ascii', [cwd])
  catch
    return ""
  endtry
endfunction

function! gin#component#branch#unicode(...) abort
  try
    let cwd = a:0 ? a:1 : ''
    return denops#request('gin', 'component:branch:unicode', [cwd])
  catch
    return ""
  endtry
endfunction
