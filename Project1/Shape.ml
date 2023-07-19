(* Shape module body *)

(* 
Aluno 1: 55226 Jose Murta
Aluno 2: 56153 Diogo Rodrigues

Comment:

	We were able to do every function asked in this project except the function
partition.
	In the function partition we only calculate the function for basic shapes.

*)

(*
01234567890123456789012345678901234567890123456789012345678901234567890123456789
   80 columns
*)


(* COMPILATION - How to build this module
         ocamlc -c Shape.mli Shape.ml
*)



(* TYPES *)

type point = float*float;;

type shape = Rect of point*point
           | Circle of point*float
           | Union of shape*shape
           | Intersection of shape*shape
           | Subtraction of shape*shape
;;


(* EXAMPLES *)

let rect1 = Rect ((0.0, 0.0), (5.0, 2.0));;
let rect2 = Rect ((2.0, 2.0), (7.0, 7.0));;
let shape1 = Union (rect1, rect2);;


(* FUNCTION hasRect *)

let rec hasRect s =
    match s with
          Rect (p,q) -> true
        | Circle (p,f) -> false
        | Union (l,r) -> hasRect l || hasRect r
        | Intersection (l,r) -> hasRect l || hasRect r
        | Subtraction (l,r) -> hasRect l || hasRect r
;;


(* FUNCTION countBasic *)

let rec countBasic s =
    match s with
          Rect (p,q) -> 1 
        | Circle (p,f) -> 1 
        | Union (l,r) -> countBasic l + countBasic r
        | Intersection (l,r) -> countBasic l + countBasic r
        | Subtraction (l,r) -> countBasic l + countBasic r
;;


(* FUNCTION belongs *)

(* Checks if point p is between p1 and p2*)
let between p p1 p2 =
	(((fst(p)>=fst(p1))&&(fst(p)<=fst(p2)))&&(snd(p)>=snd(p1))&&(snd(p)<=snd(p2)))
;;
	

(*Gives the distance between point p1 and point p2*)
let distance p1 p2 =
	sqrt((fst(p2)-.fst(p1))*.(fst(p2)-.fst(p1)) +.
	(snd(p2)-.snd(p1))*.(snd(p2)-.snd(p1)))
;;

let rec belongs p s =
    match s with 
		      Rect (point, q) -> between p point q
        | Circle (point,f) -> distance point p <= f 
        | Union (l,r) -> belongs p l || belongs p r
        | Intersection (l,r) -> belongs p l && belongs p r
        | Subtraction (l,r) -> belongs p l && not (belongs p r) 
;; 


(* FUNCTION density *)

let rec density p s =
    match s with 
		      Rect (_,_) -> if belongs p s then 1 else 0
        | Circle (_,_) -> if belongs p s then 1 else 0 
        | Union (l,r) -> density p l + density p r
        | Intersection (l,r) -> if (belongs p s) then density p l + density p r 
																else 0
        | Subtraction (l,_) ->  if (belongs p s) then (density p l) 
																else 0
;;


(* FUNCTION which *)

let rec which p s =
		match s with
				  Rect (point, q) -> if (density p s > 0) then s::[] else []
        | Circle (point,f) -> if (density p s > 0) then s::[] else []
        | Union (l,r) -> which p l @ which p r @ []
        | Intersection (l,r) -> if (density p s>0) then 
																which p l @ which p r @ [] else []
        | Subtraction (l,_) -> if (density p s>0) then 
																which p l @ [] else []
;;


(* FUNCTION minBound *)

(*Calculates the points of the Rect s*)
let pointsRect s =
	match s with
				  Rect (p, q) -> (p, q)
        | _ -> failwith "pointsRect: s is not a Rect"
;;

(*Calculates the points of the minBound*)
let rectUnion s1 s2 =
	let (a,b) = pointsRect s1 in
		let (c,d) = pointsRect s2 in 
			Rect ((min a c),(max b d))
;;


let rec minBound s =
    match s with
				  Rect (p, q) -> Rect(p, q)
        | Circle (p,f) -> Rect((fst(p)-.f,snd(p)-.f), (fst(p)+.f,snd(p)+.f))
        | Union (l,r) -> rectUnion (minBound l) (minBound r)  
        | Intersection (l,r) -> rectUnion (minBound l) (minBound r)
        | Subtraction (l,r) -> rectUnion (minBound l) (minBound r)  
;;


(* FUNCTION grid *)

(*Calculates the union of Rects which forms a par line n 
   in a grid with m columns*)
let rec parLine m n a b =
	if m > 2 then 
		if m mod 2 = 0 then
			Union(Rect(((float_of_int(m-2))*.a,(float_of_int(n-1))*.b),
			((float_of_int(m-1))*.a,float_of_int(n)*.b)), parLine (m-2) n a b) 
		else 
			Union(Rect(((float_of_int(m-2))*.a+.1.0,(float_of_int(n-1))*.b),
			((float_of_int(m-1))*.a+.1.0,float_of_int(n)*.b)), parLine (m-2) n a b) 
	else 
		Rect((0.0, float_of_int((n-1))*.b),(a, float_of_int(n) *.b))
;;

(*Calculates the union of Rects which forms an impar line n
in a grid with m columns*)
let rec imparLine m n a b =
	if m > 3 then
			Union(Rect((float_of_int(m-1)*.a,float_of_int(n-1)*.b),
			(float_of_int(m)*.a,float_of_int(n)*.b)), imparLine (m-2) n a b)
	else
		Rect((a, float_of_int(n-1)*.b),(2.0*.a, float_of_int(n)*.b))  
;;

let	rec grid m n a b =
	if n > 1 then 
		if n mod 2 = 0 then
			Union(parLine m n a b, grid m (n-1) a b)
		else
			Union(imparLine m n a b, grid m (n-1) a b)
	else 
		imparLine m n a b
;;


(* FUNCTION countBasicRepetitions *)

(*Fills a list with the basic shapes of the Shape s*)
let rec basicShapes s =
	match s with
					Rect (p, q) -> Rect(p, q)::[]
        | Circle (p,f) -> Circle(p,f)::[]
        | Union (l,r) -> basicShapes l @ basicShapes r @ []
        | Intersection (l,r) -> basicShapes l @ basicShapes r @ []
        | Subtraction (l,r) -> basicShapes l @ basicShapes r @ []  
;;

(*Calculates the repetitions of a in list l*)
let rec belong a l =
	match l with
	  [] -> 0
	| x::xs -> if a = x then 1+ belong a xs else belong a xs
;;

(*Fills a list with the elements that are repeated in list l1 *)
let rec cleanLists l1 l2 =
	match l1 with 
	| [] -> []
	| x::xs -> if (belong x l2) > 1 then x:: cleanLists xs l2 else
		         cleanLists xs l2
;;


let countBasicRepetitions s =
	 let l = basicShapes s in
		List.length (cleanLists l l)
;;



(* FUNCTION svg *)

(*Calculates the width between two points*)
let width (a,b) (c,d) =
	 c -. a 
;;

(*Calculates the height between two points*)
let height (a,b) (c,d) =
	d -. b
;;

(*Calculates a string with code SVG HTML to shape s*)
let rec svgShape s =
  match s with
				 Rect (p, q) ->  "<rect x = '" ^
													string_of_float(fst(p)) ^
													"' y ='" ^
													string_of_float(snd(p)) ^
												 "' width='" ^
												 string_of_float(width p q) ^
												 "' height='" ^
												 string_of_float(height p q) ^
												"' fill="
       | Circle (p,f) -> "<circle cx='" ^
												string_of_float(fst(p)) ^
												"' cy='" ^
												string_of_float(snd(p)) ^
												"' r='" ^
												string_of_float(f) ^
												"' fill="  
       | Union (l,r) ->   svgShape l ^ "'black' />"^ 
													svgShape r ^ "'black' />"
       | Intersection (l,r) -> svgShape l ^ "'black' />" ^ 
													svgShape r ^ "'black' />"
       | Subtraction (l,r) -> svgShape l ^ "'black' />" ^ 
														svgShape r ^ "'white' />"
;;

(*Calculates the points of the minBound with only black Shapes*)
let rectInters s1 s2 =
	let (a,b) = pointsRect s1 in
		let (c,d) = pointsRect s2 in 
			Rect ((max a c),(min b d))
;;

(*Calculates the minBound for black part of the shape*)
let rec minBoundBlackPart s =
    match s with
				  Rect (p, q) -> Rect(p, q)
        | Circle (p,f) -> Rect((fst(p)-.f,snd(p)-.f), (fst(p)+.f,snd(p)+.f))
        | Union (l,r) -> rectUnion (minBoundBlackPart l) (minBoundBlackPart r)  
        | Intersection (l,r) -> 
									rectInters (minBoundBlackPart l) (minBoundBlackPart r)
        | Subtraction (l,_) -> minBoundBlackPart l   
;;

let rec svg s =
	let string1 = "<html><body><svg " in
		let string2 = "</body></html>" in
			let (a,b) = pointsRect (minBoundBlackPart s) in
		match s with
				 Rect (p, q) ->   string1 ^ 
											"width='800' height='600'>" ^
											svgShape s ^ "</svg>" ^ string2
       | Circle (p,f) ->  string1 ^ 
											"width='800' height='600'>" ^
											svgShape s ^ "</svg>" ^ string2
       | Union (l,r) ->    string1 ^ 
											"width='800' height='600'>" ^
											svgShape s ^ "</svg>" ^ string2
       | Intersection (l,r) ->  string1 ^ 
											"x=" ^ string_of_float(fst(a)) ^
											" y=" ^ string_of_float(snd(a)) ^
											" width='" ^ 
											string_of_float(width a b) ^
											"' height='"^ string_of_float(height a b) ^"'>" ^
											svgShape s ^ "</svg>" ^ string2
       | Subtraction (l,r) -> string1 ^ 
											"width='800' height='600'>" ^
											svgShape s ^ "</svg>" ^ string2
;;


(* FUNCTION partition *)

let partition s =
    match s with
			 Rect (p,q) -> [Rect(p,q)]
		| Circle (p,f) -> [Circle(p,f)]
		| _ -> failwith "Partition: only basic shapes"
;;



