let s:saved = v:null

function gin#indicator#echo#open(id) abort
  if s:saved isnot v:null
    let s:saved.refcount += 1
    return
  endif
  let s:saved = #{
        \ more: &more,
        \ cmdheight: &cmdheight,
        \ refcount: 1,
        \}
endfunction

function gin#indicator#echo#write(id, chunk) abort
  if s:saved is v:null
    return
  endif
  let &cmdheight = max([&cmdheight, len(a:chunk)])
  redraw | echo join(a:chunk, "\n")
  call gin#internal#util#debounce(printf('let &cmdheight = %d', s:saved.cmdheight), 500)
endfunction

function gin#indicator#echo#close(id) abort
  if s:saved is v:null
    return
  endif
  let s:saved.refcount -= 1
  if s:saved.refcount is# 0
    let &more = s:saved.more
    let &cmdheight = s:saved.cmdheight
    let s:saved = v:null
  endif
endfunction
